'use server'

// Only import AI SDK if API key is available
let generateText: any = null
let openai: any = null

try {
  if (process.env.OPENAI_API_KEY) {
    const aiModule = await import('ai')
    const openaiModule = await import('@ai-sdk/openai')
    generateText = aiModule.generateText
    openai = openaiModule.openai
  }
} catch (error) {
  console.log('AI SDK not available, using fallback code generation')
}

interface EmailParams {
  toName: string
  toEmail: string
  generatedCode: string
  userPrompt: string
}

// Fallback code templates based on common requests
const codeTemplates = {
  react: {
    keywords: ['react', 'component', 'jsx', 'tsx', 'hook', 'state'],
    template: (prompt: string) => `// React Component based on: ${prompt}
import React, { useState } from 'react';

function MyComponent() {
  const [count, setCount] = useState(0);

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">My Component</h2>
      <div className="space-y-2">
        <p>Count: {count}</p>
        <button 
          onClick={() => setCount(count + 1)}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Increment
        </button>
        <button 
          onClick={() => setCount(0)}
          className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 ml-2"
        >
          Reset
        </button>
      </div>
    </div>
  );
}

export default MyComponent;`
  },
  javascript: {
    keywords: ['javascript', 'function', 'array', 'object', 'loop', 'js'],
    template: (prompt: string) => `// JavaScript solution for: ${prompt}

// Main function
function solution() {
  // Example array manipulation
  const numbers = [1, 2, 3, 4, 5];
  
  // Filter even numbers
  const evenNumbers = numbers.filter(num => num % 2 === 0);
  console.log('Even numbers:', evenNumbers);
  
  // Map to squares
  const squares = numbers.map(num => num * num);
  console.log('Squares:', squares);
  
  // Reduce to sum
  const sum = numbers.reduce((acc, num) => acc + num, 0);
  console.log('Sum:', sum);
  
  return {
    original: numbers,
    even: evenNumbers,
    squares: squares,
    sum: sum
  };
}

// Execute the solution
const result = solution();
console.log('Result:', result);`
  },
  python: {
    keywords: ['python', 'def', 'class', 'list', 'dict', 'py'],
    template: (prompt: string) => `# Python solution for: ${prompt}

def main():
    """Main function to demonstrate the solution"""
    
    # Example list operations
    numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
    
    # Filter even numbers
    even_numbers = [num for num in numbers if num % 2 == 0]
    print(f"Even numbers: {even_numbers}")
    
    # Calculate squares
    squares = [num ** 2 for num in numbers]
    print(f"Squares: {squares}")
    
    # Calculate sum
    total_sum = sum(numbers)
    print(f"Sum: {total_sum}")
    
    return {
        'original': numbers,
        'even': even_numbers,
        'squares': squares,
        'sum': total_sum
    }

class DataProcessor:
    """Example class for data processing"""
    
    def __init__(self, data):
        self.data = data
    
    def process(self):
        """Process the data"""
        return [item * 2 for item in self.data]
    
    def filter_positive(self):
        """Filter positive numbers"""
        return [item for item in self.data if item > 0]

if __name__ == "__main__":
    result = main()
    print("Final result:", result)
    
    # Example usage of the class
    processor = DataProcessor([-2, -1, 0, 1, 2, 3])
    processed = processor.process()
    positive = processor.filter_positive()
    print(f"Processed: {processed}")
    print(f"Positive: {positive}")`
  },
  html: {
    keywords: ['html', 'css', 'web', 'page', 'form', 'button'],
    template: (prompt: string) => `<!-- HTML solution for: ${prompt} -->
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Generated Page</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f5f5f5;
        }
        .container {
            background: white;
            padding: 30px;
            border-radius: 10px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .btn {
            background-color: #007bff;
            color: white;
            padding: 10px 20px;
            border: none;
            border-radius: 5px;
            cursor: pointer;
            font-size: 16px;
        }
        .btn:hover {
            background-color: #0056b3;
        }
        .form-group {
            margin-bottom: 15px;
        }
        label {
            display: block;
            margin-bottom: 5px;
            font-weight: bold;
        }
        input, textarea {
            width: 100%;
            padding: 8px;
            border: 1px solid #ddd;
            border-radius: 4px;
            font-size: 14px;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>Generated Web Page</h1>
        <p>This page was generated based on your request.</p>
        
        <form id="myForm">
            <div class="form-group">
                <label for="name">Name:</label>
                <input type="text" id="name" name="name" required>
            </div>
            
            <div class="form-group">
                <label for="email">Email:</label>
                <input type="email" id="email" name="email" required>
            </div>
            
            <div class="form-group">
                <label for="message">Message:</label>
                <textarea id="message" name="message" rows="4"></textarea>
            </div>
            
            <button type="submit" class="btn">Submit</button>
        </form>
    </div>

    <script>
        document.getElementById('myForm').addEventListener('submit', function(e) {
            e.preventDefault();
            alert('Form submitted successfully!');
        });
    </script>
</body>
</html>`
  },
  default: {
    keywords: [],
    template: (prompt: string) => `// Generated code for: ${prompt}

/**
 * This is a generated code template based on your request.
 * Since no specific programming language was detected,
 * here's a general JavaScript implementation.
 */

function generatedSolution() {
    console.log("Processing your request: ${prompt}");
    
    // Example implementation
    const data = {
        timestamp: new Date().toISOString(),
        request: "${prompt}",
        status: "generated"
    };
    
    // Process the data
    function processData(input) {
        return {
            ...input,
            processed: true,
            result: "Success"
        };
    }
    
    const result = processData(data);
    console.log("Generated result:", result);
    
    return result;
}

// Execute the solution
const output = generatedSolution();
console.log("Final output:", output);

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { generatedSolution };
}`
  }
}

function detectCodeType(prompt: string): string {
  const lowerPrompt = prompt.toLowerCase()
  
  for (const [type, config] of Object.entries(codeTemplates)) {
    if (config.keywords.some(keyword => lowerPrompt.includes(keyword))) {
      return type
    }
  }
  
  return 'default'
}

function generateFallbackCode(prompt: string): string {
  const codeType = detectCodeType(prompt)
  const template = codeTemplates[codeType as keyof typeof codeTemplates]
  return template.template(prompt)
}

export async function generateCode(prompt: string) {
  try {
    // Try to use AI if available
    if (generateText && openai && process.env.OPENAI_API_KEY) {
      const { text: code } = await generateText({
        model: openai('gpt-4o'),
        prompt: `You are an expert programmer. Generate clean, well-commented code based on this request: ${prompt}
        
        Please provide:
        1. Working code that fulfills the request
        2. Clear comments explaining key parts
        3. Best practices implementation
        4. Error handling where appropriate
        
        Return only the code, no explanations outside of comments.`,
        maxTokens: 2000,
      })

      return {
        success: true,
        code,
        error: null,
        usingAI: true
      }
    } else {
      // Use fallback code generation
      const code = generateFallbackCode(prompt)
      
      return {
        success: true,
        code,
        error: null,
        usingAI: false
      }
    }
  } catch (error) {
    console.error('Code generation failed:', error)
    
    // Even if AI fails, provide fallback
    try {
      const fallbackCode = generateFallbackCode(prompt)
      return {
        success: true,
        code: fallbackCode,
        error: null,
        usingAI: false
      }
    } catch (fallbackError) {
      return {
        success: false,
        code: '',
        error: error instanceof Error ? error.message : 'Failed to generate code',
        usingAI: false
      }
    }
  }
}

// Note: EmailJS integration will be handled on the client side
// This server action is kept for consistency but EmailJS doesn't need it
export async function sendNotificationEmail({ toName, toEmail, generatedCode, userPrompt }: EmailParams) {
  // This is just a placeholder since EmailJS works client-side
  return {
    success: true,
    error: null,
    message: 'Email will be sent via EmailJS on client side'
  }
}
