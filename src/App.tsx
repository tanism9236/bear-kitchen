import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { ToastProvider } from '@/components/Toast';
import { NavigationProvider } from '@/navigation/NavigationProvider';
import { RecipesPage } from '@/pages/RecipesPage';
import { RecipeDetailPage } from '@/pages/RecipeDetailPage';
import { RecipeFormPage } from '@/pages/RecipeFormPage';
import { PlanPage } from '@/pages/PlanPage';
import { PlanDetailPage } from '@/pages/PlanDetailPage';
import { IngredientsPage } from '@/pages/IngredientsPage';
import { IngredientFormPage } from '@/pages/IngredientFormPage';
import { MyKitchenPage } from '@/pages/MyKitchenPage';
import { MembersPage } from '@/pages/MembersPage';

export default function App() {
  return (
    <ToastProvider>
      <BrowserRouter>
        <NavigationProvider>
        <Layout>
          <Routes>
            <Route path="/" element={<Navigate to="/recipes" replace />} />
            <Route path="/recipes" element={<RecipesPage />} />
            <Route path="/recipes/new" element={<RecipeFormPage />} />
            <Route path="/recipes/:id" element={<RecipeDetailPage />} />
            <Route path="/recipes/:id/edit" element={<RecipeFormPage />} />
            <Route path="/plan" element={<PlanPage />} />
            <Route path="/plan/:id" element={<PlanDetailPage />} />
            <Route path="/ingredients" element={<IngredientsPage />} />
            <Route path="/ingredients/new" element={<IngredientFormPage />} />
            <Route path="/ingredients/:id/edit" element={<IngredientFormPage />} />
            <Route path="/my" element={<MyKitchenPage />} />
            <Route path="/my/members" element={<MembersPage />} />
            <Route path="*" element={<Navigate to="/recipes" replace />} />
          </Routes>
        </Layout>
        </NavigationProvider>
      </BrowserRouter>
    </ToastProvider>
  );
}
