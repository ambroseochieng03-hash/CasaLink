# ProGuard rules for CasaLink Android App
-keepattributes *Annotation*
-keepattributes Signature
-keepattributes SourceFile,LineNumberTable

# Preserve JavaScript Interfaces
-keepclassmembers class * {
    @android.webkit.JavascriptInterface <methods>;
}

# Preserve AndroidX & Material Design components
-keep class androidx.core.splashscreen.** { *; }
-keep class com.google.android.material.** { *; }
