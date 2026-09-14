import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/u/$username")({
  component: ProfileLayout,
});

function ProfileLayout() {
  return <Outlet />;
}