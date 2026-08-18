import type { CustomRoute, ElegantConstRoute, ElegantRoute } from '@elegant-router/types';
import { ROUTE_ROLE_MAP } from '@/constants/auth';
import { generatedRoutes } from '../elegant/routes';
import { layouts, views } from '../elegant/imports';
import { transformElegantRoutesToVueRoutes } from '../elegant/transform';

/**
 * custom routes
 *
 * @link https://github.com/soybeanjs/elegant-router?tab=readme-ov-file#custom-route
 */
const customRoutes: CustomRoute[] = [];

function applyStaticRouteRoles(route: ElegantRoute): ElegantRoute {
  type RouteWithChildren = ElegantRoute & { children?: ElegantRoute[] };

  const routeWithChildren = route as RouteWithChildren;
  const roles = ROUTE_ROLE_MAP[route.name];
  const authorizedRoute = {
    ...route,
    meta: {
      ...route.meta,
      ...(roles ? { roles: [...roles] } : {})
    }
  } as RouteWithChildren;

  if (routeWithChildren.children?.length) {
    authorizedRoute.children = routeWithChildren.children.map(child => applyStaticRouteRoles(child));
  }

  return authorizedRoute;
}

/** create routes when the auth route mode is static */
export function createStaticRoutes() {
  const constantRoutes: ElegantRoute[] = [];

  const authRoutes: ElegantRoute[] = [];

  [...customRoutes, ...generatedRoutes].map(applyStaticRouteRoles).forEach(item => {
    if (item.meta?.constant) {
      constantRoutes.push(item);
    } else {
      authRoutes.push(item);
    }
  });

  return {
    constantRoutes,
    authRoutes
  };
}

/**
 * Get auth vue routes
 *
 * @param routes Elegant routes
 */
export function getAuthVueRoutes(routes: ElegantConstRoute[]) {
  return transformElegantRoutesToVueRoutes(routes, layouts, views);
}
