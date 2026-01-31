import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import { useAuth } from '@/contexts/AuthContext'
import { getErrorMessage } from '@/helpers/error-messages'
import { Loader2, LogIn } from 'lucide-react'

export default function LoginPage() {
  const { login } = useAuth()
  const { toast } = useToast()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    username: '',
    password: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      await login(formData.username, formData.password)
      toast({
        title: 'Success',
        description: 'Logged in successfully',
      })
      navigate('/')
    } catch (error: unknown) {
      const { title, description } = getErrorMessage(error, 'login')
      toast({
        title,
        description,
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden">
      {/* Animated background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-purple-500/10 to-cyan-500/10 animated-gradient" />
      
      <Card className="w-full max-w-md glass-card border-white/10 relative z-10 animate-fade-in">
        <CardHeader className="space-y-1">
          <div className="flex items-center justify-center mb-4">
            <div className="p-3 rounded-full bg-gradient-to-r from-primary to-purple-600">
              <LogIn className="h-8 w-8 text-white" />
            </div>
          </div>
          <CardTitle className="text-2xl text-center bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
            Welcome Back
          </CardTitle>
          <CardDescription className="text-center">
            Sign in to access Blockendance
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                type="text"
                placeholder="Enter your username"
                value={formData.username}
                onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
                required
                disabled={loading}
                className="border-white/10 focus:border-primary/50 transition-colors"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={formData.password}
                onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                required
                disabled={loading}
                className="border-white/10 focus:border-primary/50 transition-colors"
              />
            </div>
            <Button type="submit" className="w-full gradient-primary hover:opacity-90 transition-opacity" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Sign In
            </Button>
          </form>
          <div className="mt-4 p-3 glass-card rounded-md text-sm text-muted-foreground border-white/5">
            <p className="font-semibold mb-2">Teacher Credentials:</p>
            <div className="space-y-1">
              <p>Teacher 1: <code className="bg-background/50 px-1 rounded">teacher1</code> / <code className="bg-background/50 px-1 rounded">teacher123</code></p>
              <p>Teacher 2: <code className="bg-background/50 px-1 rounded">teacher2</code> / <code className="bg-background/50 px-1 rounded">teacher123</code></p>
              <p>Teacher 3: <code className="bg-background/50 px-1 rounded">teacher3</code> / <code className="bg-background/50 px-1 rounded">teacher123</code></p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
      )
}

