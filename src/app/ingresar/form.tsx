'use client';
import { useActionState, useState } from 'react';
import { authenticate } from './actions';
export function AuthForm({ next }: {next:string}) {
  const [register, setRegister] = useState(false);
  const [state, action, pending] = useActionState(authenticate, { message: '' });
  return <section className="platform-card"><h2>{register ? 'Crear tu cuenta' : 'Bienvenida de nuevo'}</h2><form action={action} className="platform-form">
    <input type="hidden" name="mode" value={register ? 'register' : 'login'} /><input type="hidden" name="next" value={next} />
    {register && <label>Nombre y apellido<input name="name" required maxLength={120} autoComplete="name" /></label>}
    <label>Email<input name="email" type="email" required maxLength={254} autoComplete="email" /></label>
    <label>Contraseña<input name="password" type="password" required minLength={10} maxLength={128} autoComplete={register ? 'new-password' : 'current-password'} /></label>
    <button disabled={pending}>{pending ? 'Procesando…' : register ? 'Registrarme' : 'Ingresar'}</button>
    <p role="status">{state.message}</p>
  </form><button type="button" className="platform-secondary" onClick={() => setRegister(!register)}>{register ? 'Ya tengo una cuenta' : 'Crear una cuenta'}</button></section>;
}
