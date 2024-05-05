import pytest
import torch
import numpy as np
from dataclasses import dataclass

from internal_controlnet.args import ControlNetUnit

H = W = 128

img1 = np.ones(shape=[H, W, 3], dtype=np.uint8)
img2 = np.ones(shape=[H, W, 3], dtype=np.uint8) * 2
mask_diff = np.ones(shape=[H - 1, W - 1, 3], dtype=np.uint8) * 2
img_bad_channel = np.ones(shape=[H, W, 2], dtype=np.uint8) * 2
img_bad_dim = np.ones(shape=[1, H, W, 3], dtype=np.uint8) * 2
ui_img_diff = np.ones(shape=[H - 1, W - 1, 4], dtype=np.uint8) * 2
ui_img = np.ones(shape=[H, W, 4], dtype=np.uint8)
tensor1 = torch.zeros(size=[1, 1], dtype=torch.float16)


@pytest.fixture(scope="module")
def set_cls_funcs():
    ControlNetUnit.cls_match_model = lambda s: s in {"None", "model1", "model2"}
    ControlNetUnit.cls_match_module = lambda s: s in {"none", "module1"}
    ControlNetUnit.cls_decode_base64 = lambda s: {
        "b64img1": img1,
        "b64img2": img2,
        "b64mask_diff": mask_diff,
    }[s]
    ControlNetUnit.cls_torch_load_base64 = lambda s: {
        "b64tensor1": tensor1,
    }[s]
    ControlNetUnit.cls_get_preprocessor = lambda s: {
        "module1": MockPreprocessor(),
        "none": MockPreprocessor(),
    }[s]


def test_module_invalid(set_cls_funcs):
    with pytest.raises(ValueError) as excinfo:
        ControlNetUnit(module="foo")

    assert "module(foo) not found in supported modules." in str(excinfo.value)


def test_module_valid(set_cls_funcs):
    ControlNetUnit(module="module1")


def test_model_invalid(set_cls_funcs):
    with pytest.raises(ValueError) as excinfo:
        ControlNetUnit(model="foo")

    assert "model(foo) not found in supported models." in str(excinfo.value)


def test_model_valid(set_cls_funcs):
    ControlNetUnit(model="model1")


def test_valid_image_formats(set_cls_funcs):
    ControlNetUnit(image={"image": "b64img1"})
    ControlNetUnit(image={"image": "b64img1", "mask": "b64img2"})
    ControlNetUnit(image=["b64img1", "b64img2"])
    ControlNetUnit(image=("b64img1", "b64img2"))
    ControlNetUnit(image=[{"image": "b64img1", "mask": "b64img2"}])
    ControlNetUnit(image=[{"image": "b64img1"}])
    ControlNetUnit(image=[{"image": "b64img1", "mask": None}])
    ControlNetUnit(
        image=[
            {"image": "b64img1", "mask": "b64img2"},
            {"image": "b64img1", "mask": "b64img2"},
        ]
    )
    ControlNetUnit(
        image=[
            {"image": "b64img1", "mask": None},
            {"image": "b64img1", "mask": "b64img2"},
        ]
    )
    ControlNetUnit(
        image=[
            {"image": "b64img1"},
            {"image": "b64img1", "mask": "b64img2"},
        ]
    )
    ControlNetUnit(image="b64img1", mask="b64img2")
    ControlNetUnit(image="b64img1")
    ControlNetUnit(image="b64img1", mask_image="b64img2")
    ControlNetUnit(image=None)

    ControlNetUnit(images=None)
    ControlNetUnit(images=[])
    ControlNetUnit(images=[ui_img])
    ControlNetUnit(images=[ui_img, ui_img])
    # Images of different dim should be accepted.
    ControlNetUnit(images=[ui_img, ui_img_diff])


@pytest.mark.parametrize(
    "d",
    [
        dict(image={"mask": "b64img1"}),
        dict(image={"foo": "b64img1", "bar": "b64img2"}),
        dict(image=["b64img1"]),
        dict(image=("b64img1", "b64img2", "b64img1")),
        dict(image=[]),
        dict(image=[{"mask": "b64img1"}]),
        dict(image=None, mask="b64img2"),
        dict(image=img1),  # Wrong shape
        dict(image="b64img1", mask="b64img1", mask_image="b64img1"),
        dict(images=[img_bad_channel]),
        dict(images=[img_bad_dim]),
        # "images" should not be used by API to pass in string.
        dict(images=["b64img1"]),
        # image & mask have different H x W
        dict(image="b64img1", mask="b64mask_diff"),
    ],
)
def test_invalid_image_formats(set_cls_funcs, d):
    with pytest.raises(ValueError):
        ControlNetUnit(**d)


def test_resize_mode():
    ControlNetUnit(resize_mode="Just Resize")


def test_weight():
    ControlNetUnit(weight=0.5)
    ControlNetUnit(weight=0.0)
    with pytest.raises(ValueError):
        ControlNetUnit(weight=-1)
    with pytest.raises(ValueError):
        ControlNetUnit(weight=100)


def test_start_end():
    ControlNetUnit(guidance_start=0.0, guidance_end=1.0)
    ControlNetUnit(guidance_start=0.5, guidance_end=1.0)
    ControlNetUnit(guidance_start=0.5, guidance_end=0.5)

    with pytest.raises(ValueError):
        ControlNetUnit(guidance_start=1.0, guidance_end=0.0)
    with pytest.raises(ValueError):
        ControlNetUnit(guidance_start=11)
    with pytest.raises(ValueError):
        ControlNetUnit(guidance_end=11)


def test_effective_region_mask():
    ControlNetUnit(effective_region_mask="b64img1")
    ControlNetUnit(effective_region_mask=None)
    ControlNetUnit(effective_region_mask=img1)

    with pytest.raises(ValueError):
        ControlNetUnit(effective_region_mask=124)


def test_ipadapter_input():
    ControlNetUnit(ipadapter_input=["b64tensor1"])
    ControlNetUnit(ipadapter_input="b64tensor1")
    ControlNetUnit(ipadapter_input=None)

    with pytest.raises(ValueError):
        ControlNetUnit(ipadapter_input=[])


@dataclass
class MockSlider:
    value: float = 1
    minimum: float = 0
    maximum: float = 2


@dataclass
class MockPreprocessor:
    slider_resolution = MockSlider()
    slider_1 = MockSlider()
    slider_2 = MockSlider()


def test_preprocessor_sliders():
    unit = ControlNetUnit(module="none")
    assert unit.processor_res == 1
    assert unit.threshold_a == 1
    assert unit.threshold_b == 1
