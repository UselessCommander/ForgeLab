import { forwardRef, type InputHTMLAttributes } from 'react'

/**
 * Auth form input — suppressHydrationWarning avoids console noise when password
 * managers (e.g. NordPass `data-np-*`) mutate fields before React hydrates.
 */
const AuthInput = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  function AuthInput(props, ref) {
    return <input ref={ref} suppressHydrationWarning {...props} />
  }
)

export default AuthInput
