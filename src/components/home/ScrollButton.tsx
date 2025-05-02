'use client';

interface ScrollButtonProps {
  variant?: 'button' | 'arrow';
}

export function ScrollButton({ variant = 'button' }: ScrollButtonProps) {
  const scrollToProducts = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    document.getElementById('featured-products')?.scrollIntoView({
      behavior: 'smooth'
    });
  };

  if (variant === 'arrow') {
    return (
      <button
        onClick={scrollToProducts}
        className="text-gray-500 hover:text-gray-700 cursor-pointer"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-8 w-8"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 14l-7 7m0 0l-7-7m7 7V3"
          />
        </svg>
      </button>
    );
  }

  return (
    <button
      onClick={scrollToProducts}
      className="rounded-md bg-indigo-600 px-8 py-3 text-base font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
    >
      Ürünleri Keşfet
    </button>
  );
} 