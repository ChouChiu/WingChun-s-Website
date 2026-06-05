import { ProfileCard } from "./profile-card"

export function LeftSidebar() {
  return (
    <aside className="hidden py-6 lg:block">
      <div className="sticky top-20 animate-slide-in-left">
        <ProfileCard />
      </div>
    </aside>
  )
}
