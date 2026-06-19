import { TONE_CLASSES } from '../lib/constants.js'

export default function Badge({ tone = 'slate', children, className = '' }) {
  const cls = TONE_CLASSES[tone] || TONE_CLASSES.slate
  return <span className={`badge ${cls} ${className}`}>{children}</span>
}
