using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;
using System.Security.Claims;

namespace McpWebApi.Attributes;

public class RequireAdminAttribute : Attribute, IAuthorizationFilter
{
    public void OnAuthorization(AuthorizationFilterContext context)
    {
        var user = context.HttpContext.User;

        if (!user.Identity?.IsAuthenticated ?? true)
        {
            context.Result = new UnauthorizedObjectResult(new { message = "Yetkilendirme gerekli" });
            return;
        }

        var isAdminClaim = user.FindFirst("IsAdmin")?.Value;
        if (isAdminClaim != "True")
        {
            context.Result = new ForbidResult();
            return;
        }
    }
}
