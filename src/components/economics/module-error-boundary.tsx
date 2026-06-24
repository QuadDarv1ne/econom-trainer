'use client'

import { Component } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertTriangle, RefreshCw } from 'lucide-react'
import { logError } from '@/lib/log-error'
import type { ErrorInfo, ReactNode } from 'react'

const MAX_RETRIES = 3;

interface Props {
  children: ReactNode
  moduleName: string
  errorDescription: string
  retryLabel: string
}

interface State {
  hasError: boolean
  retryCount: number
}

export class ModuleErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, retryCount: 0 }
  }

  static getDerivedStateFromError(): State {
    return { hasError: true, retryCount: 0 }
  }

  override componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const enrichedError = errorInfo.componentStack
      ? (Object.assign(new Error(error.message), { stack: error.stack, componentStack: errorInfo.componentStack }))
      : error;
    logError(`module-error-${this.props.moduleName}`, enrichedError);
  }

  handleRetry = () => {
    const nextCount = this.state.retryCount + 1;
    if (nextCount > MAX_RETRIES) return;
    this.setState({ hasError: false, retryCount: nextCount })
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
              {this.props.errorDescription}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center pb-6">
            <Button onClick={this.handleRetry} variant="outline" size="sm">
              <RefreshCw className="mr-2 h-4 w-4" />
              {this.props.retryLabel}
            </Button>
          </CardContent>
        </Card>
      )
    }

    return this.props.children
  }
}
