<#macro kc_html>
<!DOCTYPE html>
<html lang="en" <#if realm.internationalizationEnabled>lang="${locale.current}"</#if>>
<head>
    <meta charset="utf-8">
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
    <meta name="robots" content="noindex, nofollow">
    <meta name="viewport" content="width=device-width, initial-scale=1">

    <#if properties.meta?has_content>
        <#list properties.meta?split(' ') as meta>
            <meta name="${meta?split('==')[0]}" content="${meta?split('==')[1]}"/>
        </#list>
    </#if>

    <title>${msg("loginTitle",(realm.displayName!""))}</title>
    <link rel="icon" href="${url.resourcesPath}/img/favicon.ico" />

    <#if properties.styles?has_content>
        <#list properties.styles?split(' ') as style>
            <link href="${url.resourcesPath}/${style}" rel="stylesheet" />
        </#list>
    </#if>

    <#if properties.scripts?has_content>
        <#list properties.scripts?split(' ') as script>
            <script src="${url.resourcesPath}/${script}" type="text/javascript"></script>
        </#list>
    </#if>

    <#if scripts??>
        <#list scripts as script>
            <script src="${script}" type="text/javascript"></script>
        </#list>
    </#if>
</head>

<body>
    <div id="kc-container">
        <!-- Left: Brand Panel (visible on desktop) -->
        <div class="kc-brand-panel">
            <div>
                <a href="http://localhost:3000" class="brand-logo">
                    <div class="brand-logo-icon">
                        <svg viewBox="0 0 24 24" fill="none" width="24" height="24">
                            <path d="M4 8C4 6.89543 4.89543 6 6 6H14C15.1046 6 16 6.89543 16 8V16C16 17.1046 15.1046 18 14 18H6C4.89543 18 4 17.1046 4 16V8Z" fill="white"/>
                            <path d="M16 10L20 8V16L16 14V10Z" fill="white"/>
                        </svg>
                    </div>
                    <span class="brand-logo-text">AI Interview</span>
                </a>
            </div>

            <div class="brand-content">
                <h2>Smarter hiring starts here</h2>
                <p>AI-powered asynchronous video interviews that save time and find the best candidates.</p>

                <div class="brand-features">
                    <div class="brand-feature">
                        <div class="brand-feature-icon">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m22 8-6 4 6 4V8Z"/><rect width="14" height="12" x="2" y="6" rx="2" ry="2"/></svg>
                        </div>
                        <span>Asynchronous video interviews</span>
                    </div>
                    <div class="brand-feature">
                        <div class="brand-feature-icon">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2a8 8 0 1 0 0 16 8 8 0 0 0 0-16Z"/><path d="M12 2v8l4 4"/><path d="M21.17 8A10 10 0 0 0 16 3.07"/><path d="M21.17 16A10 10 0 0 1 16 20.93"/><path d="M2.83 16A10 10 0 0 0 8 20.93"/><path d="M2.83 8A10 10 0 0 1 8 3.07"/></svg>
                        </div>
                        <span>AI-powered candidate analysis</span>
                    </div>
                    <div class="brand-feature">
                        <div class="brand-feature-icon">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" x2="18" y1="20" y2="10"/><line x1="12" x2="12" y1="20" y2="4"/><line x1="6" x2="6" y1="20" y2="14"/></svg>
                        </div>
                        <span>Detailed scoring & insights</span>
                    </div>
                    <div class="brand-feature">
                        <div class="brand-feature-icon">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                        </div>
                        <span>Hire 70% faster</span>
                    </div>
                </div>
            </div>

            <p class="brand-footer">&copy; ${.now?string('yyyy')} AI Interview Platform</p>
        </div>

        <!-- Right: Form Area -->
        <div class="kc-form-area">
            <!-- Mobile-only logo -->
            <div class="kc-mobile-logo">
                <a href="http://localhost:3000">
                    <div class="brand-logo-icon" style="width:36px;height:36px;background:#4f46e5;border-radius:12px;display:flex;align-items:center;justify-content:center;">
                        <svg viewBox="0 0 24 24" fill="none" width="20" height="20">
                            <path d="M4 8C4 6.89543 4.89543 6 6 6H14C15.1046 6 16 6.89543 16 8V16C16 17.1046 15.1046 18 14 18H6C4.89543 18 4 17.1046 4 16V8Z" fill="white"/>
                            <path d="M16 10L20 8V16L16 14V10Z" fill="white"/>
                        </svg>
                    </div>
                    <span class="brand-logo-text">AI Interview</span>
                </a>
            </div>

            <div class="kc-form-center">
                <div class="kc-form-inner">
                    <#nested>
                </div>
            </div>

            <p class="kc-mobile-footer">AI Interview Platform</p>
        </div>
    </div>
</body>
</html>
</#macro>
