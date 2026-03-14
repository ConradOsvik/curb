import { ArrowPathIcon } from "@heroicons/react/24/solid";

export default function Loader() {
  return (
    <div className="flex h-full items-center justify-center pt-8">
      <ArrowPathIcon className="animate-spin" />
    </div>
  );
}
