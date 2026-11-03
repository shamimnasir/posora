import java.util.Properties

plugins {
    id("com.android.application")
}

// The upload key lives outside the repository (~/.posora-android by default,
// or POSORA_KEYSTORE_PROPS). Without it the release build is simply unsigned.
val keystoreProps = Properties().apply {
    val path = System.getenv("POSORA_KEYSTORE_PROPS")
        ?: "${System.getProperty("user.home")}/.posora-android/keystore.properties"
    val f = file(path)
    if (f.exists()) f.inputStream().use { load(it) }
}

android {
    namespace = "com.posora.app"
    compileSdk = 36

    defaultConfig {
        applicationId = "com.posora.app"
        minSdk = 24
        targetSdk = 36
        versionCode = 1
        versionName = "1.0.0"
    }

    signingConfigs {
        if (keystoreProps.getProperty("storeFile") != null) {
            create("upload") {
                storeFile = file(keystoreProps.getProperty("storeFile"))
                storePassword = keystoreProps.getProperty("storePassword")
                keyAlias = keystoreProps.getProperty("keyAlias")
                keyPassword = keystoreProps.getProperty("keyPassword")
            }
        }
    }

    buildTypes {
        release {
            isMinifyEnabled = false
            signingConfigs.findByName("upload")?.let { signingConfig = it }
        }
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }
}

dependencies {
    implementation("com.google.androidbrowserhelper:androidbrowserhelper:2.7.4")
}
