'use client'

import React, { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

const API_URL = 'https://gaiadev.com.br/stories/'

const useAuth = () => {
  const [user, setUser] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)

  const apiCall = async (endpoint: string, method: string, data?: any) => {
    const response = await fetch(`${API_URL}${endpoint}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    })
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Algo deu errado')
    }
    return response.json()
  }

  const login = async (email: string, password: string) => {
    setIsLoading(true)
    try {
      const data = await apiCall('/login', 'POST', { email, password })
      setUser(data.user)
      return { success: true, message: "Login realizado com sucesso!" }
    } catch (error: any) {
      return { success: false, message: error.message || "Erro ao fazer login." }
    } finally {
      setIsLoading(false)
    }
  }

  const register = async (name: string, email: string, password: string) => {
    setIsLoading(true)
    try {
      const data = await apiCall('/register', 'POST', { name, email, password })
      setUser(data.user)
      return { success: true, message: "Registro realizado com sucesso!" }
    } catch (error: any) {
      return { success: false, message: error.message || "Erro ao registrar." }
    } finally {
      setIsLoading(false)
    }
  }

  const forgotPassword = async (email: string) => {
    setIsLoading(true)
    try {
      await apiCall('/forgot-password', 'POST', { email })
      return { success: true, message: "Email de recuperação enviado!" }
    } catch (error: any) {
      return { success: false, message: error.message || "Erro ao enviar email de recuperação." }
    } finally {
      setIsLoading(false)
    }
  }

  const logout = async () => {
    setIsLoading(true)
    try {
      await apiCall('/logout', 'POST')
      setUser(null)
      return { success: true, message: "Logout realizado com sucesso!" }
    } catch (error: any) {
      return { success: false, message: error.message || "Erro ao fazer logout." }
    } finally {
      setIsLoading(false)
    }
  }

  return { user, login, register, forgotPassword, logout, isLoading }
}

interface LoginComponentProps {
  onLogin: () => void;
}

const LoginComponent: React.FC<LoginComponentProps> = ({ onLogin }) => {
  const [activeTab, setActiveTab] = useState("login")
  const { login, register, forgotPassword, isLoading } = useAuth()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [name, setName] = useState("")
  const [message, setMessage] = useState("")
  const [messageType, setMessageType] = useState<"info" | "error" | "success">("info")

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    const result = await login(email, password)
    if (result.success) {
      onLogin()
    } else {
      setMessage(result.message)
      setMessageType("error")
    }
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    const result = await register(name, email, password)
    setMessage(result.message)
    setMessageType(result.success ? "success" : "error")
    if (result.success) {
      setActiveTab("login")
    }
  }

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    const result = await forgotPassword(email)
    setMessage(result.message)
    setMessageType(result.success ? "success" : "error")
  }

  return (
    <div className="flex flex-col md:flex-row min-h-screen">
      <div className="w-full md:w-1/2 bg-gray-100 p-4 md:p-8">
        <h1 className="text-3xl font-bold text-center mb-6">Taste it!</h1>
        <div className="grid grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((num) => (
            <div key={num} className="aspect-square bg-gray-300 rounded-lg shadow-md flex items-center justify-center">
              <span className="text-gray-600">Thumb {num}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="w-full md:w-1/2 bg-white p-4 md:p-8 flex items-center justify-center">
        {message && (
          <Alert className="mb-4" variant={messageType === "error" ? "destructive" : "default"}>
            <AlertTitle>{messageType === "error" ? "Erro" : "Sucesso"}</AlertTitle>
            <AlertDescription>{message}</AlertDescription>
          </Alert>
        )}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full max-w-[400px]">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="login">Login</TabsTrigger>
            <TabsTrigger value="register">Registro</TabsTrigger>
            <TabsTrigger value="forgot">Recuperar</TabsTrigger>
          </TabsList>
          <TabsContent value="login">
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input 
                  id="email" 
                  type="email" 
                  placeholder="seu@email.com" 
                  required 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Senha</Label>
                <Input 
                  id="password" 
                  type="password" 
                  required 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Entrando..." : "Entrar"}
              </Button>
            </form>
          </TabsContent>
          <TabsContent value="register">
            <form onSubmit={handleRegister} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome</Label>
                <Input 
                  id="name" 
                  type="text" 
                  placeholder="Seu nome" 
                  required 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input 
                  id="email" 
                  type="email" 
                  placeholder="seu@email.com" 
                  required 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Senha</Label>
                <Input 
                  id="password" 
                  type="password" 
                  required 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Registrando..." : "Registrar"}
              </Button>
            </form>
          </TabsContent>
          <TabsContent value="forgot">
            <form onSubmit={handleForgotPassword} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input 
                  id="email" 
                  type="email" 
                  placeholder="seu@email.com" 
                  required 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Enviando..." : "Recuperar Senha"}
              </Button>
            </form>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

interface MainPageProps {
  onLogout: () => void;
}

const MainPage: React.FC<MainPageProps> = ({ onLogout }) => {
  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Bem-vindo ao Taste it!</h1>
        <Button onClick={onLogout}>Sair</Button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Pedidos Recentes</CardTitle>
            <CardDescription>Seus últimos pedidos</CardDescription>
          </CardHeader>
          <CardContent>
            <p>Pedido #1234 - R$ 50,00</p>
            <p>Pedido #5678 - R$ 75,00</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Restaurantes Favoritos</CardTitle>
            <CardDescription>Seus lugares preferidos</CardDescription>
          </CardHeader>
          <CardContent>
            <p>Restaurante A</p>
            <p>Restaurante B</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Promoções</CardTitle>
            <CardDescription>Ofertas especiais para você</CardDescription>
          </CardHeader>
          <CardContent>
            <p>10% de desconto em pizzas</p>
            <p>Frete grátis na primeira compra</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default function IntegratedApp() {
  const { user, logout } = useAuth()
  const [message, setMessage] = useState("")
  const [messageType, setMessageType] = useState<"info" | "error" | "success">("info")

  const handleLogout = async () => {
    const result = await logout()
    setMessage(result.message)
    setMessageType(result.success ? "success" : "error")
  }

  if (!user) {
    return <LoginComponent onLogin={() => setMessage("")} />
  }

  return (
    <>
      {message && (
        <Alert className="m-4" variant={messageType === "error" ? "destructive" : "default"}>
          <AlertTitle>{messageType === "error" ? "Erro" : "Sucesso"}</AlertTitle>
          <AlertDescription>{message}</AlertDescription>
        </Alert>
      )}
      <MainPage onLogout={handleLogout} />
    </>
  )
}