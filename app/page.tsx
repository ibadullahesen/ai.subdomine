"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Send, Zap, Brain, Database, ArrowRight } from "lucide-react"

interface Message {
  id: string
  text: string
  isUser: boolean
  timestamp: string
}

export default function AxtarGetChat() {
  const [messages, setMessages] = useState<Message[]>([])
  const [inputValue, setInputValue] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [showIntro, setShowIntro] = useState(true)
  const [introStep, setIntroStep] = useState(0)
  const [keyboardHeight, setKeyboardHeight] = useState(0)
  const [conversationHistory, setConversationHistory] = useState<Array<{ role: string; content: string }>>([])
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const chatContainerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    // Create floating particles
    createParticles()

    // Handle mobile keyboard
    const handleResize = () => {
      if (window.visualViewport) {
        const heightDiff = window.innerHeight - window.visualViewport.height
        setKeyboardHeight(heightDiff)
      }
    }

    if (window.visualViewport) {
      window.visualViewport.addEventListener("resize", handleResize)
    }

    // Auto-skip intro after 3 seconds
    const timer = setTimeout(() => {
      if (showIntro) {
        skipIntro()
      }
    }, 3000)

    // Faster intro animation sequence for mobile
    const introTimer = setTimeout(() => setIntroStep(1), 300)
    const introTimer2 = setTimeout(() => setIntroStep(2), 1000)
    const introTimer3 = setTimeout(() => setIntroStep(3), 1800)
    const introTimer4 = setTimeout(() => setIntroStep(4), 2200)

    return () => {
      clearTimeout(timer)
      clearTimeout(introTimer)
      clearTimeout(introTimer2)
      clearTimeout(introTimer3)
      clearTimeout(introTimer4)
      if (window.visualViewport) {
        window.visualViewport.removeEventListener("resize", handleResize)
      }
    }
  }, [showIntro])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const createParticles = () => {
    const particlesContainer = document.getElementById("particles")
    if (!particlesContainer) return

    // Reduce particles for mobile performance
    const particleCount = window.innerWidth < 768 ? 40 : 60

    for (let i = 0; i < particleCount; i++) {
      const particle = document.createElement("div")
      particle.className = "particle"

      // Random position
      particle.style.left = Math.random() * 100 + "vw"
      particle.style.top = Math.random() * 100 + "vh"

      // Smaller particles for mobile
      const size = window.innerWidth < 768 ? Math.random() * 2 + 1 : Math.random() * 3 + 2
      particle.style.width = size + "px"
      particle.style.height = size + "px"

      // Slower animation for mobile
      const duration = window.innerWidth < 768 ? Math.random() * 20 + 15 : Math.random() * 15 + 10
      particle.style.animationDuration = duration + "s"

      particle.style.animationDelay = Math.random() * 8 + "s"

      particlesContainer.appendChild(particle)
    }
  }

  const skipIntro = () => {
    setShowIntro(false)
    setTimeout(() => {
      addWelcomeMessage()
    }, 300)
  }

  const addWelcomeMessage = () => {
    const welcomeMessage: Message = {
      id: Date.now().toString(),
      text: "Salam dostum! Mən AxtarGet AI köməkçisiyəm. Hər şeyi soruşa bilərsən - internetdən məlumat axtarım, suallarına cavab verirəm. Hansı mövzuda danışaq?",
      isUser: false,
      timestamp: getCurrentTime(),
    }
    setMessages([welcomeMessage])
  }

  const getCurrentTime = () => {
    const now = new Date()
    return now.getHours().toString().padStart(2, "0") + ":" + now.getMinutes().toString().padStart(2, "0")
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  const sendMessage = async () => {
    if (!inputValue.trim() || isLoading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputValue,
      isUser: true,
      timestamp: getCurrentTime(),
    }

    setMessages((prev) => [...prev, userMessage])

    // Add to conversation history
    const newHistory = [...conversationHistory, { role: "user", content: inputValue }]
    setConversationHistory(newHistory)

    setInputValue("")
    setIsLoading(true)

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: inputValue,
          history: newHistory.slice(-10), // Send last 10 messages for context
        }),
      })

      if (!response.ok) {
        throw new Error("Network response was not ok")
      }

      const data = await response.json()

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: data.response,
        isUser: false,
        timestamp: getCurrentTime(),
      }

      setMessages((prev) => [...prev, aiMessage])

      // Add AI response to history
      setConversationHistory((prev) => [...prev, { role: "assistant", content: data.response }])
    } catch (error) {
      console.error("Error:", error)
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: "Üzr istəyirik, xəta baş verdi. Yenidən cəhd edin.",
        isUser: false,
        timestamp: getCurrentTime(),
      }
      setMessages((prev) => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      sendMessage()
    }
  }

  const handleInputFocus = () => {
    // Scroll to bottom when input is focused
    setTimeout(() => {
      scrollToBottom()
    }, 300)
  }

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 relative overflow-hidden">
      {/* Floating Particles */}
      <div id="particles" className="fixed inset-0 pointer-events-none z-0" />

      {/* Intro Animation */}
      {showIntro && (
        <div
          className="fixed inset-0 flex flex-col items-center justify-center bg-slate-800 z-50 cursor-pointer px-4"
          onClick={skipIntro}
        >
          <div
            className={`text-4xl md:text-6xl font-bold text-blue-400 mb-6 transition-all duration-700 ${
              introStep >= 1 ? "translate-y-0 opacity-100" : "-translate-y-full opacity-0"
            }`}
          >
            <span className="bg-gradient-to-r from-blue-400 via-purple-500 to-blue-600 bg-clip-text text-transparent">
              Axtar Get
            </span>
          </div>

          <div
            className={`text-slate-400 text-lg mb-6 transition-all duration-700 delay-300 ${
              introStep >= 2 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            }`}
          >
            Yaradıcı: İbadulla Hasanov
          </div>

          <div
            className={`max-w-lg text-center px-4 mb-8 transition-all duration-700 delay-700 ${
              introStep >= 3 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
            }`}
          >
            <p className="text-base text-slate-300 leading-relaxed">
              Güclü AI köməkçi sistemi ilə sürətli və dəqiq cavablar!
            </p>
          </div>

          <div
            className={`flex flex-wrap justify-center gap-4 mb-8 transition-all duration-700 delay-1000 ${
              introStep >= 4 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
            }`}
          >
            <div className="bg-slate-700/50 backdrop-blur-sm p-4 rounded-xl text-center min-w-[120px]">
              <Zap className="w-6 h-6 text-yellow-400 mx-auto mb-2" />
              <p className="text-xs font-medium">Sürətli</p>
            </div>
            <div className="bg-slate-700/50 backdrop-blur-sm p-4 rounded-xl text-center min-w-[120px]">
              <Brain className="w-6 h-6 text-purple-400 mx-auto mb-2" />
              <p className="text-xs font-medium">Güclü AI</p>
            </div>
            <div className="bg-slate-700/50 backdrop-blur-sm p-4 rounded-xl text-center min-w-[120px]">
              <Database className="w-6 h-6 text-blue-400 mx-auto mb-2" />
              <p className="text-xs font-medium">İnternet Əlaqəsi</p>
            </div>
          </div>

          <button
            onClick={skipIntro}
            className={`flex items-center gap-2 text-slate-400 hover:text-blue-400 transition-all duration-300 ${
              introStep >= 2 ? "opacity-100" : "opacity-0"
            }`}
          >
            Keç <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Main Chat Interface */}
      <div
        className={`transition-all duration-500 ${showIntro ? "opacity-0 translate-y-8" : "opacity-100 translate-y-0"}`}
        style={{
          height: keyboardHeight > 0 ? `calc(100vh - ${keyboardHeight}px)` : "100vh",
          padding: "8px",
        }}
      >
        <div className="bg-slate-800/60 backdrop-blur-xl rounded-2xl overflow-hidden shadow-2xl border border-slate-700/30 h-full flex flex-col">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-4 text-center flex-shrink-0">
            <h1 className="text-xl font-semibold text-white">AxtarGet AI</h1>
          </div>

          {/* Messages */}
          <div
            ref={chatContainerRef}
            className="flex-1 overflow-y-auto p-3 space-y-3 bg-slate-900/20"
            style={{
              minHeight: 0,
              maxHeight: keyboardHeight > 0 ? `calc(100vh - ${keyboardHeight + 180}px)` : "calc(100vh - 180px)",
            }}
          >
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.isUser ? "justify-end" : "justify-start"} animate-in slide-in-from-bottom-2 duration-300`}
              >
                <div className={`max-w-[85%] ${message.isUser ? "order-2" : "order-1"}`}>
                  <div
                    className={`p-3 rounded-2xl ${
                      message.isUser
                        ? "bg-gradient-to-r from-blue-600/90 to-purple-600/90 text-white rounded-br-md backdrop-blur-sm"
                        : "bg-slate-700/70 text-slate-100 rounded-bl-md backdrop-blur-sm"
                    }`}
                  >
                    <p className="leading-relaxed text-sm whitespace-pre-wrap">{message.text}</p>
                    <span className="text-xs opacity-70 mt-1 block text-right">{message.timestamp}</span>
                  </div>
                </div>
              </div>
            ))}

            {/* Typing Indicator */}
            {isLoading && (
              <div className="flex justify-start animate-in slide-in-from-bottom-2 duration-300">
                <div className="bg-slate-700/60 p-3 rounded-2xl rounded-bl-md backdrop-blur-sm">
                  <div className="flex items-center space-x-2">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" />
                      <div
                        className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"
                        style={{ animationDelay: "0.1s" }}
                      />
                      <div
                        className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"
                        style={{ animationDelay: "0.2s" }}
                      />
                    </div>
                    <span className="text-xs text-slate-400">Düşünürəm...</span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-3 bg-slate-800/30 border-t border-slate-700/30 backdrop-blur-sm flex-shrink-0">
            <div className="flex gap-2">
              <Input
                ref={inputRef}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                onFocus={handleInputFocus}
                placeholder="Sualınızı yazın..."
                className="flex-1 bg-slate-900/50 border-slate-600/50 text-white placeholder-slate-400 rounded-full px-4 py-2 text-base focus:ring-2 focus:ring-blue-500/70 focus:border-transparent backdrop-blur-sm"
                disabled={isLoading}
              />
              <Button
                onClick={sendMessage}
                disabled={isLoading || !inputValue.trim()}
                className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .particle {
          position: absolute;
          width: 3px;
          height: 3px;
          background: linear-gradient(45deg, rgba(67, 97, 238, 0.4), rgba(72, 149, 239, 0.3));
          border-radius: 50%;
          animation: float 18s infinite linear;
          box-shadow: 0 0 6px rgba(67, 97, 238, 0.2);
        }

        @keyframes float {
          0% {
            transform: translateY(0) translateX(0) rotate(0deg);
            opacity: 0;
          }
          10% {
            opacity: 0.8;
          }
          90% {
            opacity: 0.8;
          }
          100% {
            transform: translateY(-100vh) translateX(30px) rotate(180deg);
            opacity: 0;
          }
        }

        .animate-in {
          animation-fill-mode: both;
        }

        .slide-in-from-bottom-2 {
          animation-name: slideInFromBottom;
        }

        @keyframes slideInFromBottom {
          from {
            opacity: 0;
            transform: translateY(8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  )
}
