/**
 * Match a Google login (outside user) to a GoodCall agent (inside gcAgent).
 * Prefer the link stored on the agent (gcAgent.linkedUserId === user._id),
 * then a pointer on the user, then email.
 */
export function resolveLinkedGcAgent(user, gcAgents) {
  if (!user) return null
  const agents = Array.isArray(gcAgents) ? gcAgents : []
  const uid = String(user._id ?? user.id ?? '')
  const email = String(user.email ?? user.emails?.[0]?.value ?? '').trim().toLowerCase()

  if (uid) {
    const byAgentLink = agents.find((x) => String(x.linkedUserId ?? '') === uid)
    if (byAgentLink) return byAgentLink
  }

  const userPtsAtAgent = user.linkedUserId ?? null
  if (userPtsAtAgent) {
    const a = agents.find((x) => String(x._id ?? x.id) === String(userPtsAtAgent))
    if (a) return a
  }

  if (email) {
    const byEmail = agents.find(
      (x) => String(x.email ?? '').trim().toLowerCase() === email
    )
    if (byEmail) return byEmail
  }

  return null
}
