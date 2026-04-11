import React from "react"

type Props = {
  text: string
  className?: string
  title?: string
}

export function StreamViewer(props: Props) {
  const { text, className, title } = props
  return (
    <div className={className}>
      {title ? <div className="mb-2 text-sm text-muted-foreground">{title}</div> : null}
      <pre className="whitespace-pre-wrap rounded-md bg-emerald-50 dark:bg-emerald-950/40 p-4 text-emerald-900 dark:text-emerald-100 font-mono text-sm min-h-[160px] shadow-inner border border-emerald-200 dark:border-emerald-900">
        {text || " "}
      </pre>
    </div>
  )
}

export default StreamViewer

