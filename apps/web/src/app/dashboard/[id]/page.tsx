import { Nav } from "@/components/marketing/nav";
import { RunView } from "./run-view";

export default async function RunPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <>
      <Nav links="app" />
      <RunView id={id} />
    </>
  );
}
