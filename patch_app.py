import sys
content = open('src/App.tsx', 'r').read()

import_statement = "import { InstallPWA } from '@/components/ui/InstallPWA';\n"

# add import
content = content.replace("import { LoadingScreen } from '@/components/ui/LoadingScreen';", "import { LoadingScreen } from '@/components/ui/LoadingScreen';\n" + import_statement)

# add component
app_component = """export function App() {
  return (
    <Router>
      <AuthProvider>
        <div className="relative min-h-screen w-full">
          {/* Fixed background layer - mobile-optimized to prevent flickering */}
          <div className="fixed inset-0 -z-10 pointer-events-none">
            <CloudBackground speed={0.8} count={6} />
          </div>
          <InstallPWA />
          <div className="relative z-0">
            <PageTransition>
              <AppRoutes />
            </PageTransition>
          </div>
        </div>
      </AuthProvider>
    </Router>
  );
}"""

content = content.replace("""export function App() {
  return (
    <Router>
      <AuthProvider>
        <div className="relative min-h-screen w-full">
          {/* Fixed background layer - mobile-optimized to prevent flickering */}
          <div className="fixed inset-0 -z-10 pointer-events-none">
            <CloudBackground speed={0.8} count={6} />
          </div>
          <div className="relative z-0">
            <PageTransition>
              <AppRoutes />
            </PageTransition>
          </div>
        </div>
      </AuthProvider>
    </Router>
  );
}""", app_component)

open('src/App.tsx', 'w').write(content)

