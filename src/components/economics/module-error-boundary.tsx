'use client'

import { Component } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertTriangle, RefreshCw } from 'lucide-react'
import { logError } from '@/lib/log-error'
import type { ErrorInfo, ReactNode } from 'react'

interface Props {
  children: ReactNode
  moduleName: string
}

interface State {
  hasError: boolean
}

export class ModuleErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(): State {
    return { hasError: true }
  }

  override componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    logError(`module-error-${this.props.moduleName}`, error, { componentStack: errorInfo.componentStack ?? undefined })
  }

  handleRetry = () => {
    this.setState({ hasError: false })
  }

  override render() {
    if (this.state.hasError) {
      return (
        <Card className="border-destructive/40 bg-destructive/5 mx-auto max-w-md my-8">
          <CardHeader className="text-center pb-2">
            <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-destructive/10">
              <AlertTriangle className="h-5 w-5 text-destructive" />
            </div>
            <CardTitle className="text-lg">{this.props.moduleName}</CardTitle>
            <CardDescription>
              Something went wrong loading this module. Try again.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center pb-6">
            <Button onClick={this.handleRetry} variant="outline" size="sm">
              <RefreshCw className="mr-2 h-4 w-4" />
              Retry
            </Button>
          </CardContent>
        </Card>
      )
    }

    return this.props.children
  }
}
