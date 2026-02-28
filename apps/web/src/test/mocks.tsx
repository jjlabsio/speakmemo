// Shared mock components for testing
// These replace @repo/ui dependencies with simple HTML equivalents
import * as React from "react";

export const MockButton = ({
  children,
  className,
  ...props
}: React.ComponentProps<"button">) => (
  <button className={className} {...props}>
    {children}
  </button>
);

export const MockCard = ({
  children,
  className,
  ...props
}: React.ComponentProps<"div">) => (
  <div className={className} {...props}>
    {children}
  </div>
);
