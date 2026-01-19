# Security Policy

## 🔒 Security Best Practices

This document outlines security best practices for the Smart Trader Cockpit application.

## API Key Security

### ⚠️ Critical: Protecting Your API Key

Your Google Gemini API key is **sensitive information** that should be protected at all costs.

**DO:**
- ✅ Store API keys in `.env.local` (already gitignored)
- ✅ Use environment variables in production
- ✅ Rotate API keys regularly (every 90 days recommended)
- ✅ Monitor API usage in Google AI Studio
- ✅ Set up usage limits and quotas

**DON'T:**
- ❌ Commit `.env.local` to version control
- ❌ Share API keys via email, chat, or public channels
- ❌ Hardcode API keys in source code
- ❌ Use the same API key across multiple projects
- ❌ Expose API keys in client-side code

### API Key Rotation Process

If you believe your API key has been compromised, follow these steps immediately:

1. **Revoke the compromised key**
   - Go to [Google AI Studio](https://aistudio.google.com/apikey)
   - Delete the compromised API key

2. **Generate a new key**
   - Create a new API key in Google AI Studio
   - Copy the new key

3. **Update your application**
   - Update `.env.local` with the new key:
     ```env
     GEMINI_API_KEY=your_new_api_key_here
     ```

4. **Verify the new key**
   ```bash
   npm run verify
   ```

5. **Update production environment**
   - If deployed, update environment variables in your hosting platform
   - Restart the application

### Checking Git History

To check if `.env.local` was ever accidentally committed:

```bash
git log --all --full-history -- .env.local
```

If the command shows any commits, your API key may have been exposed and should be rotated immediately.

## File Upload Security

The application implements several security measures for file uploads:

- **File Size Limit**: 5MB maximum
- **File Type Validation**: Only JPEG, PNG, GIF, and WebP formats allowed
- **Client-Side Validation**: Prevents invalid files before upload
- **No Server-Side Storage**: Uploaded files are processed in-memory only

## Production Deployment

### Environment Variables

When deploying to production:

1. **Never use development `.env.local` in production**
2. **Set environment variables through your hosting platform:**
   - Vercel: Project Settings → Environment Variables
   - Netlify: Site Settings → Environment Variables
   - Other platforms: Refer to their documentation

3. **Required variables for production:**
   ```env
   GEMINI_API_KEY=<your_production_api_key>
   DEMO_MODE=false
   NODE_ENV=production
   ```

### Recommended Security Headers

Consider adding these security headers in production (via `next.config.ts`):

```typescript
const nextConfig = {
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin'
          }
        ]
      }
    ];
  }
};
```

## Rate Limiting

The application implements:

- **10-second cooldown** between analyses
- **Client-side enforcement** to prevent API abuse

For production, consider implementing:
- Server-side rate limiting
- API usage monitoring
- Cost alerts in Google Cloud Console

## Monitoring

### API Usage Monitoring

Regularly check your API usage:

1. Visit [Google AI Studio](https://aistudio.google.com/apikey)
2. Monitor your quota usage
3. Set up billing alerts if using paid tier
4. Review API call patterns for anomalies

### Application Logs

In production:
- Monitor application logs for errors
- Watch for unusual API call patterns
- Track failed authentication attempts

## Reporting Security Issues

If you discover a security vulnerability:

1. **Do NOT** open a public issue
2. Contact the maintainer directly
3. Provide detailed information about the vulnerability
4. Allow reasonable time for a fix before public disclosure

## Security Checklist

Before deploying to production:

- [ ] API key is stored in environment variables
- [ ] `.env.local` is in `.gitignore`
- [ ] No sensitive data in Git history
- [ ] API usage limits configured
- [ ] File upload validation enabled
- [ ] Security headers configured
- [ ] HTTPS enabled on production domain
- [ ] Regular security updates scheduled

## Additional Resources

- [Google AI Studio Security Best Practices](https://ai.google.dev/docs/security)
- [Next.js Security Guidelines](https://nextjs.org/docs/app/building-your-application/configuring/content-security-policy)
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)

---

**Last Updated**: January 18, 2026

Remember: Security is an ongoing process, not a one-time setup. Stay vigilant!
