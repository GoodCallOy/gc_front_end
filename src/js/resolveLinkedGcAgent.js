/**
 * Match session user to a GC agent row — either direction:
 * - user.linkedUserId === gcAgent._id
 * - gcAgent.linkedUserId === user._id
 */
export function resolveLinkedGcAgent(user, gcAgents) {
  if (!user) return null
  const agents = Array.isArray(gcAgents) ? gcAgents : []

  const userPtsAtAgent = user.linkedUserId ?? null
  if (userPtsAtAgent) {
    const a = agents.find(x => String(x._id ?? x.id) === String(userPtsAtAgent))
    if (a) return a
  }

  const uid = user._id ?? user.id
  if (!uid) return null
  return agents.find(x => String(x.linkedUserId ?? '') === String(uid)) || null
}
