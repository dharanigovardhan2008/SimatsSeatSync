import sys

content = open('src/components/events/TeamChoiceModal.tsx', 'r').read()

content = content.replace("import { Input } from '@/components/ui/Input';", "import CodeSlots from '@/components/ui/CodeSlots';")

old_form = """        <form onSubmit={handleJoin} className="space-y-3 mb-6">
          <Input
            label="Have a team code?"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="e.g. K7P2QX"
            maxLength={6}
            className="tracking-[0.2em] font-bold text-center uppercase"
          />
          {error && <p className="text-red-600 text-sm">{error}</p>}
          <Button type="submit" variant="primary" className="w-full" isLoading={joining} disabled={!code.trim()}>
            Join Team
          </Button>
        </form>"""

new_form = """        <form onSubmit={handleJoin} className="space-y-5 mb-8">
          <div className="flex flex-col items-center gap-3">
            <p className="text-[13px] font-bold text-[#86868B] uppercase tracking-wider">Have a team code?</p>
            <CodeSlots
              length={6}
              value={code}
              onChange={setCode}
              onComplete={(completedCode) => onJoinWithCode(completedCode)}
            />
          </div>
          {error && <p className="text-red-600 text-sm text-center">{error}</p>}
          <Button type="submit" variant="primary" className="w-full" isLoading={joining} disabled={code.length < 6}>
            Join Team
          </Button>
        </form>"""

content = content.replace(old_form, new_form)

open('src/components/events/TeamChoiceModal.tsx', 'w').write(content)

