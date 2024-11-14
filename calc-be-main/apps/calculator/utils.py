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
        f"Q3. Solve for x: 2x + 3 = 7\n"
        f"Steps: 2x = 7 - 3, 2x = 4, x = 2.\n"
        f"Q4. Simplify (a^2 - b^2)/(a - b)\n"
        f"Steps: Factor numerator: (a + b)(a - b)/(a - b), Simplify: a + b.\n"
        f"Q5. Calculate the derivative of y = x^2\n"
        f"Steps: y' = 2x.\n"
        f"Q6. Integrate f(x) = e^x\n"
        f"Steps: ∫e^x dx = e^x + C.\n"
        f"\n"
        f"There are several types of equations or expressions that may appear in the image. Only one case will apply each time:\n"
        f"1. **Simple Mathematical Expressions and Inequalities** (e.g., 2 + 2, 3 * 4, 5 / 6, 7 - 8, 5 > 3, x <= 10):\n"
        f"   - Solve or simplify and return the answer as a list containing one dictionary: [{{'expr': 'given expression', 'result': 'calculated answer'}}].\n"
        f"2. **Equations with One Variable** (e.g., x^2 + 2x + 1 = 0):\n"
        f"   - Solve for the variable and return a dictionary: {{'expr': 'variable', 'result': 'value', 'assign': True}}.\n"
        f"3. **Systems of Equations** (e.g., 3y + 4x = 0, 5x^2 + 6y + 7 = 12):\n"
        f"   - Solve for the given variables and return a list of dictionaries, one for each variable.\n"
        f"4. **Calculus Problems** (e.g., derivatives, integrals):\n"
        f"   - Solve and return the answer in the appropriate mathematical form as a dictionary.\n"
        f"5. **Variable Assignments** (e.g., x = 4, y = 5, z = 6):\n"
        f"   - Assign values to variables and return them as a list of dictionaries with 'assign': True.\n"
        f"6. **Graphical Math Problems** (e.g., word problems illustrated with drawings):\n"
        f"   - Analyze the drawing and accompanying information.\n"
        f"   - Return the answer as a dictionary: {{'expr': 'given expression', 'result': 'calculated answer'}}.\n"
        f"7. **Abstract Concepts** (e.g., emotions, historic references):\n"
        f"   - Detect and explain the abstract concept presented in the drawing.\n"
        f"   - Return the answer as a dictionary with 'expr' being the explanation and 'result' being the abstract concept.\n"
        f"8. **Inequalities and Absolute Values** (e.g., |x - 3| < 5):\n"
        f"   - Solve and return the solution set.\n"
        f"9. **Complex Numbers** (e.g., Solve z^2 + 1 = 0):\n"
        f"   - Handle complex solutions if necessary.\n"
        f"10. **Matrices and Determinants** (e.g., compute the determinant of a matrix):\n"
        f"    - Perform the calculation and return the result.\n"
        f"\n"
        f"**Formatting Rules:**\n"
        f"- Return the answer as a list of dictionaries, following the format: [{{'expr': '...', 'result': '...'}}].\n"
        f"- Include an 'assign' key with value True if a variable assignment is made.\n"
        f"- Use proper mathematical notation.\n"
        f"- Avoid any markdown or formatting that is not plain text.\n"
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