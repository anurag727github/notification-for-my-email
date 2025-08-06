'use client'

import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Mic, MicOff, Send, Copy, CheckCircle, AlertCircle, Loader2, Settings } from 'lucide-react'
import { generateCode } from './actions'

interface GenerationStatus {
  isGenerating: boolean
  isSending: boolean
  error: string | null
  success: string | null
}

// EmailJS Configuration - Replace with your actual values
const EMAILJS_CONFIG = {
  publicKey: 'gSzAYtERZ6iPLH_OV',    // Paste your public key here
  serviceId: 'service_indlo7r',    // Paste your service ID here  
  templateId: 'template_2j9tqk7'   // Paste your template ID here
}

export default function CodeGeneratorWithEmail() {
  const [prompt, setPrompt] = useState('')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [generatedCode, setGeneratedCode] = useState('')
  const [isListening, setIsListening] = useState(false)
  const [speechSupported, setSpeechSupported] = useState(false)
  const [emailJSLoaded, setEmailJSLoaded] = useState(false)
  const [emailJSError, setEmailJSError] = useState<string | null>(null)
  const [status, setStatus] = useState<GenerationStatus>({
    isGenerating: false,
    isSending: false,
    error: null,
    success: null
  })
  
  const recognitionRef = useRef<any>(null)
  const timeoutRef = useRef<NodeJS.Timeout>()
  const emailJSRef = useRef<any>(null)

  // Load EmailJS
  useEffect(() => {
    const loadEmailJS = async () => {
      try {
        // Load EmailJS from CDN
        const script = document.createElement('script')
        script.src = 'https://cdn.jsdelivr.net/npm/@emailjs/browser@4/dist/email.min.js'
        script.onload = () => {
          if ((window as any).emailjs) {
            emailJSRef.current = (window as any).emailjs
            emailJSRef.current.init(EMAILJS_CONFIG.publicKey)
            setEmailJSLoaded(true)
            console.log('EmailJS loaded successfully')
          }
        }
        script.onerror = () => {
          setEmailJSError('Failed to load EmailJS library')
        }
        document.head.appendChild(script)
      } catch (error) {
        setEmailJSError('Error loading EmailJS: ' + (error as Error).message)
      }
    }

    loadEmailJS()
  }, [])

  useEffect(() => {
    // Check for speech recognition support
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
      setSpeechSupported(!!SpeechRecognition)
      
      if (SpeechRecognition) {
        recognitionRef.current = new SpeechRecognition()
        recognitionRef.current.continuous = true
        recognitionRef.current.interimResults = true
        recognitionRef.current.lang = 'en-US'

        recognitionRef.current.onresult = (event: any) => {
          let finalTranscript = ''

          for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript
            if (event.results[i].isFinal) {
              finalTranscript += transcript
            }
          }

          if (finalTranscript) {
            setPrompt(prev => prev + finalTranscript)
          }
        }

        recognitionRef.current.onend = () => {
          setIsListening(false)
        }

        recognitionRef.current.onerror = () => {
          setIsListening(false)
        }
      }
    }
  }, [])

  const clearStatus = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
    timeoutRef.current = setTimeout(() => {
      setStatus(prev => ({ ...prev, error: null, success: null }))
    }, 5000)
  }

  const toggleListening = () => {
    if (!recognitionRef.current) return

    if (isListening) {
      recognitionRef.current.stop()
      setIsListening(false)
    } else {
      recognitionRef.current.start()
      setIsListening(true)
    }
  }

  const sendEmailWithEmailJS = async (emailParams: any) => {
    if (!emailJSRef.current) {
      throw new Error('EmailJS not loaded')
    }

    try {
      const response = await emailJSRef.current.send(
        EMAILJS_CONFIG.serviceId,
        EMAILJS_CONFIG.templateId,
        emailParams
      )
      return response
    } catch (error) {
      console.error('EmailJS send error:', error)
      throw error
    }
  }

  const testEmailConfiguration = async () => {
    if (!emailJSLoaded) {
      setStatus(prev => ({ ...prev, error: 'EmailJS not loaded yet' }))
      clearStatus()
      return
    }

    setStatus(prev => ({ ...prev, success: 'Testing email configuration...' }))

    try {
      const testParams = {
        to_name: 'Test User',
        to_email: 'test@example.com',
        from_name: 'Code Generator App',
        user_prompt: 'Test email configuration',
        generated_code: 'console.log("Hello World! This is a test.");',
        user_message: 'This is a test email to verify EmailJS configuration.'
      }

      await sendEmailWithEmailJS(testParams)
      setStatus(prev => ({ ...prev, success: '✅ Email configuration test successful!' }))
    } catch (error) {
      setStatus(prev => ({ 
        ...prev, 
        error: `Email test failed: ${error instanceof Error ? error.message : 'Unknown error'}` 
      }))
    }
    clearStatus()
  }

  const [generationMethod, setGenerationMethod] = useState<'ai' | 'fallback' | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!prompt.trim() || !name.trim() || !email.trim()) {
      setStatus(prev => ({ ...prev, error: 'Please fill in all fields' }))
      clearStatus()
      return
    }

    if (!emailJSLoaded) {
      setStatus(prev => ({ ...prev, error: 'EmailJS not ready. Please wait and try again.' }))
      clearStatus()
      return
    }

    setStatus({
      isGenerating: true,
      isSending: false,
      error: null,
      success: null
    })
    setGeneratedCode('')
    setGenerationMethod(null)

    try {
      // Generate code based on prompt
      const result = await generateCode(prompt)
      
      if (!result.success) {
        throw new Error(result.error || 'Code generation failed')
      }

      setGeneratedCode(result.code)
      setGenerationMethod(result.usingAI ? 'ai' : 'fallback')
      
      // Update status to sending email
      setStatus({
        isGenerating: false,
        isSending: true,
        error: null,
        success: `Code generated successfully${result.usingAI ? ' using AI' : ' using smart templates'}! Sending email...`
      })

      // Send email notification using EmailJS
      const emailParams = {
        to_name: name,
        to_email: email,
        from_name: 'AI Code Generator',
        user_prompt: prompt,
        generated_code: result.code,
        user_message: `Hello ${name}! Here's your freshly generated code based on your request: "${prompt}". Happy coding! 🚀`
      }

      await sendEmailWithEmailJS(emailParams)

      setStatus({
        isGenerating: false,
        isSending: false,
        error: null,
        success: `✅ Code generated and email sent successfully to ${email}!`
      })

      // Reset form
      setPrompt('')
      setName('')
      setEmail('')
      
    } catch (error) {
      setStatus({
        isGenerating: false,
        isSending: false,
        error: error instanceof Error ? error.message : 'An error occurred',
        success: null
      })
    }
    
    clearStatus()
  }

  const copyToClipboard = async () => {
    if (!generatedCode) return
    
    try {
      await navigator.clipboard.writeText(generatedCode)
      setStatus(prev => ({ ...prev, success: 'Code copied to clipboard!' }))
      clearStatus()
    } catch (error) {
      setStatus(prev => ({ ...prev, error: 'Failed to copy code' }))
      clearStatus()
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center py-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            🤖 AI Code Generator with Email Notifications
          </h1>
          <p className="text-lg text-gray-600">
            Speak or type your coding request, get AI-generated code delivered to your inbox!
          </p>
        </div>

        {/* EmailJS Status */}
        <Card className={`border-2 ${emailJSLoaded ? 'border-green-200 bg-green-50' : emailJSError ? 'border-red-200 bg-red-50' : 'border-yellow-200 bg-yellow-50'}`}>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                📧 EmailJS Configuration
                {emailJSLoaded ? (
                  <span className="text-sm bg-green-100 text-green-800 px-2 py-1 rounded-full">
                    ✅ Ready
                  </span>
                ) : (
                  <span className="text-sm bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full">
                    ⏳ Loading...
                  </span>
                )}
              </span>
              {emailJSLoaded && (
                <Button variant="outline" size="sm" onClick={testEmailConfiguration}>
                  🧪 Test Email
                </Button>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {emailJSError ? (
              <div className="text-red-800">
                <p><strong>❌ Error:</strong> {emailJSError}</p>
                <p className="text-sm mt-2">Please check your EmailJS configuration.</p>
              </div>
            ) : emailJSLoaded ? (
              <div className="text-green-800">
                <p><strong>✅ EmailJS Status:</strong> Ready to send emails</p>
                <div className="text-sm mt-2 space-y-1">
                  <p><strong>Service ID:</strong> {EMAILJS_CONFIG.serviceId}</p>
                  <p><strong>Template ID:</strong> {EMAILJS_CONFIG.templateId}</p>
                </div>
              </div>
            ) : (
              <div className="text-yellow-800">
                <p><strong>⏳ Loading EmailJS...</strong> Please wait while we initialize the email service.</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Configuration Notice */}
        {EMAILJS_CONFIG.publicKey === 'YOUR_ACTUAL_PUBLIC_KEY' && (
          <Card className="border-orange-200 bg-orange-50">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <Settings className="h-5 w-5 text-orange-600 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-orange-800 mb-1">
                    EmailJS Configuration Required
                  </h3>
                  <p className="text-sm text-orange-700 mb-2">
                    Please update the EmailJS configuration in the code with your actual values:
                  </p>
                  <ul className="text-sm text-orange-700 list-disc list-inside space-y-1">
                    <li>Replace <code>YOUR_EMAILJS_PUBLIC_KEY</code> with your EmailJS public key</li>
                    <li>Replace <code>YOUR_SERVICE_ID</code> with your EmailJS service ID</li>
                    <li>Replace <code>YOUR_TEMPLATE_ID</code> with your EmailJS template ID</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* AI Configuration Notice */}
        {!process.env.OPENAI_API_KEY && (
          <Card className="border-yellow-200 bg-yellow-50">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className="text-yellow-600">⚠️</div>
                <div>
                  <h3 className="font-semibold text-yellow-800 mb-1">
                    Running in Template Mode
                  </h3>
                  <p className="text-sm text-yellow-700">
                    The app is currently using smart code templates. For advanced AI-powered code generation, 
                    add your OpenAI API key to the environment variables.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Status Messages */}
        {status.error && (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="flex items-center gap-2 p-4">
              <AlertCircle className="h-5 w-5 text-red-600" />
              <span className="text-red-800">{status.error}</span>
            </CardContent>
          </Card>
        )}

        {status.success && (
          <Card className="border-green-200 bg-green-50">
            <CardContent className="flex items-center gap-2 p-4">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <span className="text-green-800">{status.success}</span>
            </CardContent>
          </Card>
        )}

        {/* Main Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span>📝 Code Generation Request</span>
              {(status.isGenerating || status.isSending) && (
                <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* User Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Your Name</Label>
                  <Input
                    id="name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter your name"
                    disabled={status.isGenerating || status.isSending}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Your Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    disabled={status.isGenerating || status.isSending}
                    required
                  />
                </div>
              </div>

              {/* Prompt Input */}
              <div className="space-y-2">
                <Label htmlFor="prompt" className="flex items-center gap-2">
                  Code Request
                  {speechSupported && (
                    <Button
                      type="button"
                      variant={isListening ? "destructive" : "outline"}
                      size="sm"
                      onClick={toggleListening}
                      disabled={status.isGenerating || status.isSending}
                    >
                      {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                      {isListening ? 'Stop' : 'Voice'}
                    </Button>
                  )}
                </Label>
                <Textarea
                  id="prompt"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Describe what code you want me to generate... (e.g., 'Create a React component for a todo list' or 'Write a Python function to sort an array')"
                  rows={4}
                  disabled={status.isGenerating || status.isSending}
                  required
                  className={isListening ? 'border-red-300 bg-red-50' : ''}
                />
                {isListening && (
                  <p className="text-sm text-red-600 flex items-center gap-1">
                    <Mic className="h-4 w-4" />
                    Listening... Speak your code request
                  </p>
                )}
              </div>

              {/* Submit Button */}
              <Button 
                type="submit" 
                className="w-full"
                disabled={status.isGenerating || status.isSending || !emailJSLoaded}
              >
                {status.isGenerating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating Code...
                  </>
                ) : status.isSending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending Email...
                  </>
                ) : !emailJSLoaded ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Loading EmailJS...
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    Generate Code & Send Email
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Generated Code Display */}
        {generatedCode && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span>🎯 Generated Code</span>
                  {generationMethod === 'ai' && (
                    <span className="text-sm bg-green-100 text-green-800 px-2 py-1 rounded-full">
                      🤖 AI Generated
                    </span>
                  )}
                  {generationMethod === 'fallback' && (
                    <span className="text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                      📝 Template Based
                    </span>
                  )}
                </div>
                <Button variant="outline" size="sm" onClick={copyToClipboard}>
                  <Copy className="mr-2 h-4 w-4" />
                  Copy Code
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-gray-900 rounded-lg p-4 overflow-x-auto">
                <pre className="text-green-400 text-sm">
                  <code>{generatedCode}</code>
                </pre>
              </div>
              {generationMethod === 'fallback' && (
                <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-800">
                    <strong>💡 Tip:</strong> This code was generated using smart templates. 
                    For more advanced AI-generated code, add your OpenAI API key to the environment variables.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Status Information */}
        {(status.isGenerating || status.isSending) && (
          <Card className="border-blue-200 bg-blue-50">
            <CardContent className="p-6">
              <div className="text-center">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-blue-900 mb-2">
                  {status.isGenerating ? '🤖 AI is generating your code...' : '📧 Sending email notification...'}
                </h3>
                <p className="text-blue-700">
                  {status.isGenerating 
                    ? 'Please wait while our AI analyzes your request and generates the perfect code for you.'
                    : 'Your code has been generated! We\'re now sending it to your email address via EmailJS.'
                  }
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
