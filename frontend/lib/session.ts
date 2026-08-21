const JUST_SIGNED_IN = "grad-cs-just-signed-in";

export function markJustSignedIn() {
  sessionStorage.setItem(JUST_SIGNED_IN, "1");
}

export function consumeJustSignedIn() {
  if (sessionStorage.getItem(JUST_SIGNED_IN) !== "1") return false;
  sessionStorage.removeItem(JUST_SIGNED_IN);
  return true;
}

export function firstName(fullName: string) {
  return fullName.split(" ").filter(Boolean)[0] ?? "there";
}

export function greetingForNow() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}
