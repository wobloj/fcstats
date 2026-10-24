import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@workspace/ui/components/avatar"

export default function Avatars(props: {
  avatarUrl?: string
  skillLevel?: number
}) {
  return (
    <Avatar className="h-32 w-32 rounded-md border-4 border-primary object-cover after:border-none">
      <AvatarImage
        className="rounded-none border-none!"
        src={props.avatarUrl}
      />
      <AvatarFallback>{props.avatarUrl ? "Avatar" : "Fallback"}</AvatarFallback>
    </Avatar>
  )
}
