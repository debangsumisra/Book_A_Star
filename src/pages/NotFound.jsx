import PageShell from '../components/PageShell.jsx'
import EmptyState from '../components/EmptyState.jsx'
import Button from '../components/Button.jsx'

export default function NotFound() {
  return (
    <PageShell>
      <EmptyState title="Page not found" message="The link may be broken, or the page may have moved."
        action={<Button to="/">Go home</Button>} />
    </PageShell>
  )
}
