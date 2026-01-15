import ParticleField from "./components/ParticleField";
import LaunchButton from "./components/LaunchButton";

export default function Home() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-bg-primary">
      {/* Particle Field Background */}
      <ParticleField />

      {/* Subtle Gradient Overlay */}
      <div className="fixed inset-0 bg-gradient-subtle opacity-30 pointer-events-none z-10" />

      {/* Main Content */}
      <main className="relative z-20 flex min-h-screen flex-col items-center justify-center px-4 sm:px-6 lg:px-8 py-20">
        <div className="flex flex-col items-center justify-center text-center space-y-12 max-w-5xl mx-auto">
          
          {/* Year Badge */}
          <div className="mb-4 animate-scale-in">
            <div className="inline-block px-6 py-2 rounded-full bg-bg-elevated border border-muted">
              <span className="text-sm font-medium text-text-secondary">2026</span>
            </div>
          </div>

          {/* Main Heading */}
          <h1 className="text-7xl sm:text-8xl md:text-9xl lg:text-[12rem] font-black leading-none mb-12 animate-fade-in-up delay-200">
            <span className=" gradient-text">STELLAR</span>
            <span className="leading-none block text-text-primary">WRAP</span>
          </h1>

          {/* Subheading */}
          <p className="text-xl sm:text-2xl md:text-3xl font-light max-w-4xl mx-auto leading-relaxed px-4 mb-8 text-text-secondary animate-fade-in-up delay-400">
            Your weekly, monthly, or yearly journey on the Stellar network,{" "}
            <span className="font-medium text-text-primary">wrapped</span>
          </p>

       <div className="flex flex-col items-center justify-center gap-4">
           {/* Description */}
           <div className="text-base sm:text-lg max-w-3xl mx-auto space-y-2 px-4 mb-12 text-text-muted animate-fade-in delay-600">
            <p>
              Discover your personalized review with your top transactions,
            </p>
            <p>
              smart contracts, NFT activity, and achievements on Stellar.
            </p>
          </div>

          {/* CTA Button */}
          <div className="mb-9 animate-fade-in-up delay-800">
            <LaunchButton />
          </div>

          {/* Feature Pills */}
          <div className="flex flex-wrap items-center justify-center gap-4 mt-12 animate-fade-in delay-1000">
            {[
              "Soroban Contracts",
              "NFT Activity",
              "DeFi Stats",
              "Network Volume",
            ].map((feature, index) => (
              <div
                key={feature}
                className="feature-pill animate-fade-in-up"
                style={{ animationDelay: `${1 + index * 0.1}s` }}
              >
                {feature}
              </div>
            ))}
          </div>

          <p className="text-sm mt-12 text-text-muted animate-fade-in delay-1400">
            Connect your Stellar wallet to get started
          </p>
       </div>

          {/* Bottom Note */}
         
        </div>
      </main>
    </div>
  );
}
