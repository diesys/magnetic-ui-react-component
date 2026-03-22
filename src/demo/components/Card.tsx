const CARD_IMAGE =
	"https://plus.unsplash.com/premium_photo-1773277369068-8488542c42ee?q=80&w=1287&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D";

export function Card() {
	return (
		<div className="w-72 rounded-2xl overflow-hidden shadow-2xl backdrop-blur-sm bg-background/20 border border-foreground/10">
			<div className="relative">
				<img
					src={CARD_IMAGE}
					alt="abstract"
					className={`w-full h-60 object-cover object-center transition-filter duration-400 ease-in`}
				/>
				<div className="absolute bg-mode/60 mix-blend-color size-full inset-0 z-30"></div>
			</div>

			<div className="p-4 flex flex-col gap-2">
				<p className="text-foreground text-sm font-semibold">Magnetic Card</p>
				<p className="text-xs leading-relaxed text-foreground/50">
					Move your mouse near this card to feel the gravitational pull.
				</p>

				<div className="flex gap-2 mt-1">
					<span className="text-[10px] px-2 py-0.5 rounded-full bg-mode/20 text-mode border border-mode/30">
						React
					</span>
				</div>
			</div>
		</div>
	);
}
