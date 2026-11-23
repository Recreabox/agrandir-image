"""Export des modèles Real-ESRGAN officiels (BSD-3-Clause, xinntao/Real-ESRGAN) en ONNX
pour onnxruntime-web (WebGPU + WASM).

- Architectures recopiées de basicsr/realesrgan (SRVGGNetCompact, RRDBNet) : pas de dépendance basicsr.
- Calcul fp32, poids stockés en fp16 (+ Cast) pour diviser le téléchargement par 2
  sans changer la précision de calcul (ORT replie les Cast à l'initialisation de la session).
- Vérifie l'équivalence torch vs ORT (CPU) sur une entrée aléatoire non carrée.

Usage : .venv/bin/python export_onnx.py [id_modele ...]
"""
import json
import os
import sys
import time

import numpy as np
import onnx
import onnxruntime as ort
import torch
import torch.nn as nn
import torch.nn.functional as F
from onnx import TensorProto, helper, numpy_helper

HERE = os.path.dirname(os.path.abspath(__file__))
WEIGHTS = os.path.join(HERE, "weights")
OUT = os.path.join(HERE, "onnx")
os.makedirs(OUT, exist_ok=True)


class SRVGGNetCompact(nn.Module):
    def __init__(self, num_in_ch=3, num_out_ch=3, num_feat=64, num_conv=16, upscale=4, act_type="prelu"):
        super().__init__()
        self.upscale = upscale
        self.body = nn.ModuleList()
        self.body.append(nn.Conv2d(num_in_ch, num_feat, 3, 1, 1))
        self.body.append(self._act(act_type, num_feat))
        for _ in range(num_conv):
            self.body.append(nn.Conv2d(num_feat, num_feat, 3, 1, 1))
            self.body.append(self._act(act_type, num_feat))
        self.body.append(nn.Conv2d(num_feat, num_out_ch * upscale * upscale, 3, 1, 1))
        self.upsampler = nn.PixelShuffle(upscale)

    @staticmethod
    def _act(act_type, num_feat):
        if act_type == "relu":
            return nn.ReLU()
        if act_type == "prelu":
            return nn.PReLU(num_parameters=num_feat)
        return nn.LeakyReLU(negative_slope=0.1)

    def forward(self, x):
        out = x
        for layer in self.body:
            out = layer(out)
        out = self.upsampler(out)
        base = F.interpolate(x, scale_factor=self.upscale, mode="nearest")
        return out + base


class ResidualDenseBlock(nn.Module):
    def __init__(self, num_feat=64, num_grow_ch=32):
        super().__init__()
        self.conv1 = nn.Conv2d(num_feat, num_grow_ch, 3, 1, 1)
        self.conv2 = nn.Conv2d(num_feat + num_grow_ch, num_grow_ch, 3, 1, 1)
        self.conv3 = nn.Conv2d(num_feat + 2 * num_grow_ch, num_grow_ch, 3, 1, 1)
        self.conv4 = nn.Conv2d(num_feat + 3 * num_grow_ch, num_grow_ch, 3, 1, 1)
        self.conv5 = nn.Conv2d(num_feat + 4 * num_grow_ch, num_feat, 3, 1, 1)
        self.lrelu = nn.LeakyReLU(negative_slope=0.2)

    def forward(self, x):
        x1 = self.lrelu(self.conv1(x))
        x2 = self.lrelu(self.conv2(torch.cat((x, x1), 1)))
        x3 = self.lrelu(self.conv3(torch.cat((x, x1, x2), 1)))
        x4 = self.lrelu(self.conv4(torch.cat((x, x1, x2, x3), 1)))
        x5 = self.conv5(torch.cat((x, x1, x2, x3, x4), 1))
        return x5 * 0.2 + x


class RRDB(nn.Module):
    def __init__(self, num_feat, num_grow_ch=32):
        super().__init__()
        self.rdb1 = ResidualDenseBlock(num_feat, num_grow_ch)
        self.rdb2 = ResidualDenseBlock(num_feat, num_grow_ch)
        self.rdb3 = ResidualDenseBlock(num_feat, num_grow_ch)

    def forward(self, x):
        out = self.rdb1(x)
        out = self.rdb2(out)
        out = self.rdb3(out)
        return out * 0.2 + x


class RRDBNet(nn.Module):
    def __init__(self, num_in_ch=3, num_out_ch=3, scale=4, num_feat=64, num_block=23, num_grow_ch=32):
        super().__init__()
        self.scale = scale
        if scale == 2:
            num_in_ch = num_in_ch * 4
        self.conv_first = nn.Conv2d(num_in_ch, num_feat, 3, 1, 1)
        self.body = nn.Sequential(*[RRDB(num_feat, num_grow_ch) for _ in range(num_block)])
        self.conv_body = nn.Conv2d(num_feat, num_feat, 3, 1, 1)
        self.conv_up1 = nn.Conv2d(num_feat, num_feat, 3, 1, 1)
        self.conv_up2 = nn.Conv2d(num_feat, num_feat, 3, 1, 1)
        self.conv_hr = nn.Conv2d(num_feat, num_feat, 3, 1, 1)
        self.conv_last = nn.Conv2d(num_feat, num_out_ch, 3, 1, 1)
        self.lrelu = nn.LeakyReLU(negative_slope=0.2)

    def forward(self, x):
        feat = F.pixel_unshuffle(x, 2) if self.scale == 2 else x
        feat = self.conv_first(feat)
        body_feat = self.conv_body(self.body(feat))
        feat = feat + body_feat
        feat = self.lrelu(self.conv_up1(F.interpolate(feat, scale_factor=2, mode="nearest")))
        feat = self.lrelu(self.conv_up2(F.interpolate(feat, scale_factor=2, mode="nearest")))
        return self.conv_last(self.lrelu(self.conv_hr(feat)))


MODELS = {
    "realesr-general-x4v3": (["realesr-general-x4v3.pth"], lambda: SRVGGNetCompact(num_conv=32), None),
    "realesr-general-wdn-x4v3": (["realesr-general-wdn-x4v3.pth"], lambda: SRVGGNetCompact(num_conv=32), None),
    # Débruitage intermédiaire : même méthode que inference_realesrgan.py -dn 0.5 (interpolation des poids)
    "realesr-general-x4v3-dn50": (["realesr-general-x4v3.pth", "realesr-general-wdn-x4v3.pth"], lambda: SRVGGNetCompact(num_conv=32), [0.5, 0.5]),
    "realesr-animevideov3": (["realesr-animevideov3.pth"], lambda: SRVGGNetCompact(num_conv=16), None),
    "RealESRGAN_x4plus": (["RealESRGAN_x4plus.pth"], lambda: RRDBNet(num_block=23), None),
    "RealESRGAN_x4plus_anime_6B": (["RealESRGAN_x4plus_anime_6B.pth"], lambda: RRDBNet(num_block=6), None),
}


def load_sd(path):
    sd = torch.load(path, map_location="cpu", weights_only=True)
    for key in ("params_ema", "params"):
        if key in sd:
            return sd[key]
    return sd


def build(model_id):
    files, ctor, dni = MODELS[model_id]
    model = ctor()
    sds = [load_sd(os.path.join(WEIGHTS, f)) for f in files]
    if dni:
        sd = {k: sum(w * s[k] for w, s in zip(dni, sds)) for k in sds[0]}
    else:
        sd = sds[0]
    model.load_state_dict(sd, strict=True)
    model.eval()
    return model


def weights_to_fp16_storage(model_proto, min_elems=64):
    """Stocke les gros initialiseurs float32 en float16 + Cast->float32 (calcul inchangé en fp32)."""
    g = model_proto.graph
    new_inits, cast_nodes = [], []
    for init in g.initializer:
        arr = numpy_helper.to_array(init)
        if init.data_type == TensorProto.FLOAT and arr.size >= min_elems:
            half = numpy_helper.from_array(arr.astype(np.float16), name=init.name + "__fp16")
            new_inits.append(half)
            cast_nodes.append(helper.make_node("Cast", [half.name], [init.name], to=TensorProto.FLOAT, name=init.name + "__cast"))
        else:
            new_inits.append(init)
    del g.initializer[:]
    g.initializer.extend(new_inits)
    nodes = list(g.node)
    del g.node[:]
    g.node.extend(cast_nodes + nodes)
    return model_proto


def export(model_id):
    model = build(model_id)
    dummy = torch.rand(1, 3, 64, 64)
    fp32_path = os.path.join(OUT, f"{model_id}.fp32.onnx")
    torch.onnx.export(
        model, dummy, fp32_path,
        input_names=["input"], output_names=["output"],
        dynamic_axes={"input": {2: "h", 3: "w"}, "output": {2: "oh", 3: "ow"}},
        opset_version=17, do_constant_folding=True, dynamo=False,
    )
    m = onnx.load(fp32_path)
    onnx.checker.check_model(m)
    m16 = weights_to_fp16_storage(m)
    out_path = os.path.join(OUT, f"{model_id}.onnx")
    onnx.save(m16, out_path)
    onnx.checker.check_model(onnx.load(out_path))

    x = torch.rand(1, 3, 48, 72)
    with torch.no_grad():
        ref = model(x).numpy()
    res = {}
    for label, p in (("fp32", fp32_path), ("fp16w", out_path)):
        sess = ort.InferenceSession(p, providers=["CPUExecutionProvider"])
        t0 = time.time()
        y = sess.run(None, {"input": x.numpy()})[0]
        res[label] = {
            "max_abs_diff": float(np.abs(y - ref).max()),
            "mean_abs_diff": float(np.abs(y - ref).mean()),
            "ms": round((time.time() - t0) * 1000, 1),
        }
    sess = ort.InferenceSession(out_path, providers=["CPUExecutionProvider"])
    tile = np.random.rand(1, 3, 160, 160).astype(np.float32)
    sess.run(None, {"input": tile})
    t0 = time.time()
    sess.run(None, {"input": tile})
    tile_ms = round((time.time() - t0) * 1000, 1)
    ops = sorted({n.op_type for n in onnx.load(out_path).graph.node})
    info = {
        "id": model_id,
        "bytes_fp32": os.path.getsize(fp32_path),
        "bytes": os.path.getsize(out_path),
        "check": res,
        "cpu_tile160_ms": tile_ms,
        "out_shape": list(ref.shape),
        "ops": ops,
    }
    print(json.dumps(info), flush=True)
    return info


if __name__ == "__main__":
    torch.set_num_threads(8)
    ids = sys.argv[1:] or list(MODELS)
    report = [export(i) for i in ids]
    with open(os.path.join(OUT, "report.json"), "w") as f:
        json.dump(report, f, indent=2)
