use jni::objects::JString;
use jni::JNIEnv;

/// This function converts a JString into a Rust string.
fn jstring_to_string(jni: JNIEnv, js: JString) -> String {
    jni.get_string(js).unwrap().into()
}
