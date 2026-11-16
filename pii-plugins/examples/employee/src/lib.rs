//! Synthetic employee-ID processor. Replace this library function with your detector.
use finsafe_pii_plugin_sdk::{Finding, Output, Segment};
// The SDK uses a content-free failure marker across the callback boundary.
#[allow(clippy::result_unit_err)]
pub fn process(segments: &[Segment]) -> Result<Output, ()> {
    let mut output = Output::default();
    for segment in segments {
        if let Some(start) = segment.text.find("ACME-") {
            let end = start
                + segment.text[start..]
                    .find(char::is_whitespace)
                    .unwrap_or(segment.text.len() - start);
            output.findings.push(Finding {
                segment_id: segment.id.clone(),
                category: "acme.employee_id".into(),
                start,
                end,
                confidence: 1.0,
            });
        }
    }
    Ok(output)
}
#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn processor_can_be_debugged_without_a_host() {
        let segments = [Segment {
            id: "s0".into(),
            role: "user".into(),
            text: "张三 ACME-1234 hello".into(),
        }];
        let output = process(&segments).unwrap();
        assert_eq!(output.findings[0].start, "张三 ".len());
        assert_eq!(output.findings[0].category, "acme.employee_id");
        assert!(output.edits.is_empty());
    }
}
