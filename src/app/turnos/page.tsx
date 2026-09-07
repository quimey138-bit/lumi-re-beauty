import { redirect } from "next/navigation";
import { AGENDA_URL } from "../../data/booking";

export default function TurnosPage() {
  redirect(AGENDA_URL);
}
