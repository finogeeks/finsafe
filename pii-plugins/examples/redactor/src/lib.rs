//! Simple 18-character resident-ID regex example. No checksum or calendar validation.
use finsafe_pii_plugin_sdk::{Edit, Finding, Output, Segment};
use regex::Regex;

pub struct Redactor {
    pattern: Regex,
    keep_first: usize,
    keep_last: usize,
}
impl Redactor {
    /// Select the visible prefix/suffix. At least one character must be hidden.
    pub fn new(keep_first: usize, keep_last: usize) -> Result<Self, &'static str> {
        if keep_first
            .checked_add(keep_last)
            .is_none_or(|count| count >= 18)
        {
            return Err("visible prefix and suffix must total fewer than 18 characters");
        }
        Ok(Self {
            pattern: Regex::new(r"[1-9][0-9]{16}[0-9Xx]").expect("static resident-ID pattern"),
            keep_first,
            keep_last,
        })
    }
    pub fn process(&self, segments: &[Segment]) -> Output {
        let mut output = Output::default();
        for segment in segments {
            let mut rewritten = String::new();
            let mut end = 0;
            for matched in self.pattern.find_iter(&segment.text) {
                let bytes = segment.text.as_bytes();
                // Do not recognize an 18-character substring of a longer ASCII token.
                if matched
                    .start()
                    .checked_sub(1)
                    .is_some_and(|i| bytes[i].is_ascii_alphanumeric())
                    || bytes
                        .get(matched.end())
                        .is_some_and(u8::is_ascii_alphanumeric)
                {
                    continue;
                }
                output.findings.push(Finding {
                    segment_id: segment.id.clone(),
                    category: "example.cn_resident_id".into(),
                    start: matched.start(),
                    end: matched.end(),
                    confidence: 1.0,
                });
                rewritten.push_str(&segment.text[end..matched.start()]);
                let number = matched.as_str(); // The regex admits ASCII only.
                rewritten.push_str(&number[..self.keep_first]);
                rewritten.push_str("XXX");
                rewritten.push_str(&number[number.len() - self.keep_last..]);
                end = matched.end();
            }
            if end != 0 {
                rewritten.push_str(&segment.text[end..]);
                output.edits.push(Edit {
                    segment_id: segment.id.clone(),
                    text: rewritten,
                });
            }
        }
        output
    }
}
/// Default callback for library-test debugging: keep the first 3 and last 4.
#[allow(clippy::result_unit_err)]
pub fn process(segments: &[Segment]) -> Result<Output, ()> {
    Ok(Redactor::new(3, 4)
        .expect("valid example mask")
        .process(segments))
}
#[cfg(test)]
mod tests {
    use super::*;
    fn segment(id: &str, role: &str, text: &str) -> Segment {
        Segment {
            id: id.into(),
            role: role.into(),
            text: text.into(),
        }
    }
    #[test]
    fn processor_can_be_debugged_without_a_host() {
        let input = [segment("s0", "user", "张三 11010119900101123X hello")];
        let output = process(&input).unwrap();
        assert_eq!(output.findings.len(), 1, "resident ID must be detected");
        assert_eq!(output.findings[0].start, "张三 ".len());
        assert_eq!(output.findings[0].end, "张三 11010119900101123X".len());
        assert_eq!(output.findings[0].category, "example.cn_resident_id");
        assert_eq!(output.edits[0].text, "张三 110XXX123X hello");
    }
    #[test]
    fn all_ids_in_user_and_tool_segments_are_masked_without_changing_other_text() {
        let input = [
            segment(
                "user",
                "user",
                "证件：11010119900101123X、320102200002020011。",
            ),
            segment("tool", "tool", "文件读到 11010119900101123x\n结束"),
            segment("clean", "tool", "没有证件号"),
        ];
        let output = process(&input).unwrap();
        assert_eq!(output.findings.len(), 3);
        assert_eq!(output.edits.len(), 2);
        assert_eq!(output.edits[0].text, "证件：110XXX123X、320XXX0011。");
        assert_eq!(output.edits[1].segment_id, "tool");
        assert_eq!(output.edits[1].text, "文件读到 110XXX123x\n结束");
        for finding in &output.findings {
            let original = input.iter().find(|s| s.id == finding.segment_id).unwrap();
            assert_eq!(original.text[finding.start..finding.end].len(), 18);
        }
    }
    #[test]
    fn prefix_and_suffix_can_be_selected_without_exposing_the_full_id() {
        let input = [segment("s0", "tool", "11010119900101123X")];
        assert_eq!(
            Redactor::new(0, 4).unwrap().process(&input).edits[0].text,
            "XXX123X"
        );
        assert_eq!(
            Redactor::new(6, 4).unwrap().process(&input).edits[0].text,
            "110101XXX123X"
        );
        assert!(Redactor::new(14, 4).is_err());
        assert!(Redactor::new(usize::MAX, 4).is_err());
    }
    #[test]
    fn shorter_ids_and_substrings_of_longer_numbers_are_unchanged() {
        let output = process(&[segment(
            "s0",
            "user",
            "123456789012345 911010119900101123X 11010119900101123X9",
        )])
        .unwrap();
        assert!(output.findings.is_empty());
        assert!(output.edits.is_empty());
    }
}
