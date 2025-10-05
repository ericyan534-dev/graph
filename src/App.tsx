import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import Index from "./pages/Index";
import DNAPage from "./pages/DNAPage";
import InfluencePage from "./pages/InfluencePage";
import About from "./pages/About";
import TransparencyGraph from "./pages/TransparencyGraph";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/dna">
              <Route index element={<DNAPage />} />
              <Route path=":billId" element={<DNAPage />} />
            </Route>
            <Route path="/influence">
              <Route index element={<InfluencePage />} />
              <Route path=":billId" element={<InfluencePage />} />
            </Route>
            <Route path="/about" element={<About />} />
            <Route path="/transparency/:id" element={<TransparencyGraph />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
