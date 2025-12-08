import { Link } from 'react-router-dom'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { GraduationCap, FileCheck, BarChart3, Shield } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'

const features = [
  {
    icon: FileCheck,
    title: 'Take Attendance',
    description: 'Record student attendance securely on the blockchain',
    link: '/attendance',
    linkText: 'Start Attendance',
    roles: ['teacher'],
  },
  {
    icon: GraduationCap,
    title: 'View Records',
    description: 'Search and view attendance records from the blockchain',
    link: '/records',
    linkText: 'View Records',
    roles: ['student', 'teacher'],
  },
  {
    icon: BarChart3,
    title: 'Analytics',
    description: 'Get insights and statistics from attendance data',
    link: '/analytics',
    linkText: 'View Analytics',
    roles: ['teacher'],
  },
  {
    icon: Shield,
    title: 'Check Integrity',
    description: 'Verify blockchain integrity and detect tampering',
    link: '/integrity',
    linkText: 'Check Integrity',
    roles: ['student', 'teacher'],
  },
]

export default function HomePage() {
  const { role } = useAuth()

  const visibleFeatures = features.filter((feature) => feature.roles.includes(role))

  return (
    <div className="space-y-8">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
          Blockendance
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          A secure, blockchain-based attendance management system.
          Every record is immutable and cryptographically verified.
        </p>
      </div>

      {visibleFeatures.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">
            Please log in to access the available features.
          </p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {visibleFeatures.map((feature) => {
            const Icon = feature.icon
            return (
              <Card key={feature.title} className="flex flex-col">
                <CardHeader>
                  <div className="mb-2">
                    <Icon className="h-8 w-8 text-primary" />
                  </div>
                  <CardTitle>{feature.title}</CardTitle>
                  <CardDescription>{feature.description}</CardDescription>
                </CardHeader>
                <CardContent className="flex-1 flex items-end">
                  <Button asChild className="w-full">
                    <Link to={feature.link}>{feature.linkText}</Link>
                  </Button>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}

