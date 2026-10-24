declare module "country-code-emoji" {
  export function countryCodeEmoji(countryCode: string): string

  export default countryCodeEmoji
}

declare module "country-list" {
  export function getName(countryCode: string): string | undefined
}
