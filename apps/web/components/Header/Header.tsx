import Navbar from "./Navbar"
import Searchbar from "./Searchbar"
import type { SearchbarProps } from "./Searchbar"

export default function Header({
  searchbarProps,
  hasResults,
}: {
  searchbarProps: Pick<SearchbarProps, "onSubmit" | "isLoading">
  hasResults: boolean
}) {
  return (
    <header
      className={`flex flex-row items-center justify-between gap-4 bg-background p-6 transition-[margin] duration-700 ease-in-out ${
        hasResults ? "mb-6" : "mb-20"
      }`}
    >
      <div className="max-w-64 grow basis-0">
        <p className="text-md text-primary uppercase">FCStats</p>
      </div>
      <Navbar />
      <Searchbar maxWidth="64" {...searchbarProps} />
    </header>
  )
}
