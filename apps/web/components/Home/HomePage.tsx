"use client"

import { AnimatePresence, motion } from "motion/react"
import Searchbar from "../Header/Searchbar"
import type { SearchbarProps } from "../Header/Searchbar"

export default function HomePage({
  searchbarProps,
  hasResults,
}: {
  searchbarProps: Pick<
    SearchbarProps,
    "onSubmit" | "isLoading" | "recentSearches"
  >
  hasResults: boolean
}) {
  return (
    <motion.section
      layout
      transition={{ layout: { duration: 0.65, ease: [0.22, 1, 0.36, 1] } }}
      className="relative z-10 flex justify-center"
    >
      <motion.div
        layout
        className={`flex flex-col justify-center ${
          hasResults
            ? "mx-auto w-full max-w-7xl px-6"
            : "w-full max-w-10/12 md:max-w-1/2"
        }`}
      >
        <AnimatePresence initial={false}>
          {!hasResults && (
            <motion.div
              key="welcome"
              initial={{ opacity: 1, y: 0 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16, height: 0, marginBottom: 0 }}
              transition={{ duration: 0.35, ease: "easeInOut" }}
              className="overflow-hidden"
            >
              <h1 className="text-center text-2xl font-bold text-foreground uppercase md:text-4xl">
                TRACK CS2 FACEIT ELO,{" "}
                <span className="text-primary">Advanced Combat Telemetry</span>{" "}
                & Round Impact
              </h1>
              <p className="px-1/12 md:px-1/2 mt-4 text-center text-base text-foreground/70 md:text-lg">
                The competitive analytics suite for Counter-Strike 2. Look up
                any Faceit player to uncover granular ADR, swing rating, K/D
                trends, map win percentages, and verified match history across
                all competitive seasons.
              </p>
            </motion.div>
          )}
        </AnimatePresence>
        <motion.div
          layout
          className={hasResults ? "mt-0" : "mt-10"}
          transition={{ layout: { duration: 0.65, ease: [0.22, 1, 0.36, 1] } }}
        >
          <Searchbar
            maxWidth="full"
            size="lg"
            animatePlaceholder={!hasResults}
            {...searchbarProps}
          />
        </motion.div>
      </motion.div>
    </motion.section>
  )
}
