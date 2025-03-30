import { createBrowserRouter } from 'react-router-dom'
import AboutPage from './pages/about'
import ImprintImagePage from './pages/imprint'
import HomePage from './pages/home'
import ErrorPage from './components/error-page'
import { DefaultLayout } from './components/layout'

export function createRouter(): ReturnType<typeof createBrowserRouter> {
  return createBrowserRouter([
    {
      path: '/',
      element: (
        <DefaultLayout>
          <HomePage />
        </DefaultLayout>
      ),
      ErrorBoundary: ErrorPage,
    },
    {
      path: 'about',
      element: <AboutPage />,
      ErrorBoundary: ErrorPage,
    },
    {
      path: 'imprint',
      element: <ImprintImagePage />,
      ErrorBoundary: ErrorPage,
    },
  ])
}
