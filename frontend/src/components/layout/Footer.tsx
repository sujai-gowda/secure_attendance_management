export default function Footer() {
  return (
    <footer className="border-t py-6 md:py-0">
      <div className="container mx-auto px-4">
        <div className="flex flex-col items-center justify-between gap-4 md:h-24 md:flex-row">
          <p className="text-center text-sm leading-loose text-muted-foreground md:text-left">
            Built with blockchain technology. Secure and immutable attendance records.
          </p>
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} Blockendance
          </p>
        </div>
      </div>
    </footer>
  )
}

