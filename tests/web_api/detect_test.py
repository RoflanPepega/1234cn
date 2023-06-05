import requests
import unittest
import importlib
utils = importlib.import_module(
    'extensions.sd-webui-controlnet.tests.utils', 'utils')
utils.setup_test_env()


class TestDetectEndpointWorking(unittest.TestCase):
    def setUp(self):
        self.base_detect_args = {
            "controlnet_module": "canny",
            "controlnet_input_images": [utils.readImage("test/test_files/img2img_basic.png")],
            "controlnet_processor_res": 512,
            "controlnet_threshold_a": 0,
            "controlnet_threshold_b": 0,
        }

    def test_detect_with_invalid_module_performed(self):
        detect_args = self.base_detect_args.copy()
        detect_args.update({
            "controlnet_module": "INVALID",
        })
        self.assertEqual(utils.detect(detect_args).status_code, 422)

    def test_detect_with_no_input_images_performed(self):
        detect_args = self.base_detect_args.copy()
        detect_args.update({
            "controlnet_input_images": [],
        })
        self.assertEqual(utils.detect(detect_args).status_code, 422)

    def test_detect_with_valid_args_performed(self):
        detect_args = self.base_detect_args
        response = utils.detect(detect_args)

        self.assertEqual(response.status_code, 200)

        # With pixel_perfect
        detect_args.update({
            "controlnet_pixel_perfect": True
        })
        response = utils.detect(detect_args)

        self.assertEqual(response.status_code, 200)

    def test_detect_with_invalid_resize_mode_performed(self):
        detect_args = self.base_detect_args.copy()
        detect_args.update({
            "controlnet_pixel_perfect": True,
            "controlnet_resize_mode": "INVALID"
        })

        self.assertEqual(utils.detect(detect_args).status_code, 422)


if __name__ == "__main__":
    unittest.main()
