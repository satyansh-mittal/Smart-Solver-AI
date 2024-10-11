# import torch
# from transformers import pipeline, BitsAndBytesConfig, AutoProcessor, LlavaForConditionalGeneration
# from PIL import Image

# # quantization_config = BitsAndBytesConfig(load_in_4bit=True, bnb_4bit_compute_dtype=torch.float16)
# quantization_config = BitsAndBytesConfig(
#     load_in_4bit=True,
#     bnb_4bit_compute_dtype=torch.float16
# )


# model_id = "llava-hf/llava-1.5-7b-hf"
# processor = AutoProcessor.from_pretrained(model_id)
# model = LlavaForConditionalGeneration.from_pretrained(model_id, quantization_config=quantization_config, device_map="auto")
# # pipe = pipeline("image-to-text", model=model_id, model_kwargs={"quantization_config": quantization_config})

# def analyze_image(image: Image):
#     prompt = "USER: <image>\nAnalyze the equation or expression in this image, and return answer in format: {expr: given equation in LaTeX format, result: calculated answer}"

#     inputs = processor(prompt, images=[image], padding=True, return_tensors="pt").to("cuda")
#     for k, v in inputs.items():
#         print(k,v.shape)

#     output = model.generate(**inputs, max_new_tokens=20)
#     generated_text = processor.batch_decode(output, skip_special_tokens=True)
#     for text in generated_text:
#         print(text.split("ASSISTANT:")[-1])

import google.generativeai as genai
import ast
import json
from PIL import Image
from constants import GEMINI_API_KEY

genai.configure(api_key=GEMINI_API_KEY)

def analyze_image(img: Image, dict_of_vars: dict):
    model = genai.GenerativeModel(model_name="gemini-1.5-flash")
    dict_of_vars_str = json.dumps(dict_of_vars, ensure_ascii=False)
    prompt = (
        f"You have been provided with an image containing mathematical expressions, equations, or graphical math problems that you need to solve. "
        f"Please follow the instructions below to process and return the results appropriately. "
        f"Use the PEMDAS rule (Parentheses, Exponents, Multiplication and Division, Addition and Subtraction) when solving mathematical expressions. "
        f"PEMDAS stands for the order of operations: Parentheses first, then Exponents, followed by Multiplication and Division (from left to right), and finally Addition and Subtraction (from left to right). "
        f"\n"
        f"**Examples:**\n"
        f"Q1. 2 + 3 * 4\n"
        f"Steps: 3 * 4 = 12, 2 + 12 = 14.\n"
        f"Q2. 2 + 3 + 5 * 4 - 8 / 2\n"
        f"Steps: 5 * 4 = 20, 8 / 2 = 4, 2 + 3 = 5, 5 + 20 = 25, 25 - 4 = 21.\n"
        f"\n"
        f"There are five types of equations or expressions that may appear in the image. Only one case will apply each time:\n"
        f"1. **Simple Mathematical Expressions** (e.g., 2 + 2, 3 * 4, 5 / 6, 7 - 8):\n"
        f"   - Solve and return the answer as a list containing one dictionary: [{{'expr': 'given expression', 'result': 'calculated answer'}}].\n"
        f"2. **Systems of Equations** (e.g., x^2 + 2x + 1 = 0, 3y + 4x = 0, 5x^2 + 6y + 7 = 12):\n"
        f"   - Solve for the given variables and return a comma-separated list of dictionaries, one for each variable. Each dictionary should follow the format: {{'expr': 'variable', 'result': 'value', 'assign': True}}.\n"
        f"   - **Example:** [{{'expr': 'x', 'result': 2, 'assign': True}}, {{'expr': 'y', 'result': 5, 'assign': True}}].\n"
        f"3. **Variable Assignments** (e.g., x = 4, y = 5, z = 6):\n"
        f"   - Assign values to variables and return them as a list of dictionaries with an additional key 'assign': True.\n"
        f"   - **Format:** [{{'expr': 'variable', 'result': 'value', 'assign': True}}, ...]\n"
        f"4. **Graphical Math Problems** (e.g., word problems illustrated with drawings, such as cars colliding, trigonometric problems, Pythagorean theorem, etc.):\n"
        f"   - Analyze the drawing and accompanying information. Pay close attention to different colors used in the problem description.\n"
        f"   - Return the answer as a list containing one dictionary: [{{'expr': 'given expression', 'result': 'calculated answer'}}].\n"
        f"5. **Abstract Concepts** (e.g., emotions like love, hate, jealousy; historic references to war, invention, discovery, quotes, etc.):\n"
        f"   - Detect and explain the abstract concept presented in the drawing.\n"
        f"   - Return the answer as a list containing one dictionary with 'expr' being the explanation and 'result' being the abstract concept: [{{'expr': 'explanation', 'result': 'abstract concept'}}].\n"
        f"\n"
        f"**Formatting Rules:**\n"
        f"- Use extra backslashes for escape characters like \\f -> \\\\f, \\n -> \\\\n, etc.\n"
        f"- DO NOT use backticks or Markdown formatting.\n"
        f"- Properly quote the keys and values in the dictionary for easier parsing with Python's ast.literal_eval.\n"
        f"\n"
        f"Here is a dictionary of user-assigned variables. If the given expression contains any of these variables, substitute their values accordingly: {dict_of_vars_str}.\n"
        f"\n"
        f"Analyze the equation or expression in the image and return the answer according to the rules mentioned above."
    )
    response = model.generate_content([prompt, img])
    print(response.text)
    answers = []
    try:
        answers = ast.literal_eval(response.text)
    except Exception as e:
        print(f"Error in parsing response from Gemini API: {e}")
    print('returned answer ', answers)
    for answer in answers:
        if 'assign' in answer:
            answer['assign'] = True
        else:
            answer['assign'] = False
    return answers