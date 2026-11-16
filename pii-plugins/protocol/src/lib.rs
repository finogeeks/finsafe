//! Public PII processor wire contract and bounded framing. No product configuration.
use serde::{Deserialize, Serialize};
use std::io::{self, Read, Write};
pub const VERSION: u32 = 1;
pub const FRAME_LIMIT: usize = 16 * 1024 * 1024;
fn valid_code(value: &str) -> bool {
    !value.is_empty()
        && value.len() <= 128
        && value
            .bytes()
            .all(|b| b.is_ascii_alphanumeric() || b"._-".contains(&b))
}
#[derive(Clone, Debug, PartialEq, Eq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct Segment {
    pub id: String,
    pub role: String,
    pub text: String,
}
#[derive(Clone, Debug, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct Request {
    pub schema_version: u32,
    pub request_id: String,
    pub segments: Vec<Segment>,
}
#[derive(Clone, Debug, PartialEq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct Finding {
    pub segment_id: String,
    pub category: String,
    pub start: usize,
    pub end: usize,
    pub confidence: f32,
}
#[derive(Clone, Debug, PartialEq, Eq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct Edit {
    pub segment_id: String,
    pub text: String,
}
#[derive(Clone, Debug, Default, PartialEq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct Output {
    #[serde(default)]
    pub findings: Vec<Finding>,
    #[serde(default)]
    pub edits: Vec<Edit>,
}
#[derive(Clone, Debug, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct Response {
    pub schema_version: u32,
    pub request_id: String,
    pub output: Option<Output>,
}
impl Output {
    pub fn validate(&self, request: &Request) -> Result<(), &'static str> {
        self.validate_findings(request)?;
        self.validate_edits(request)
    }
    pub fn validate_findings(&self, request: &Request) -> Result<(), &'static str> {
        if self.findings.len() > 4096 {
            return Err("plugin_output_limit");
        }
        for f in &self.findings {
            let s = request
                .segments
                .iter()
                .find(|s| s.id == f.segment_id)
                .ok_or("plugin_unknown_segment")?;
            if !valid_code(&f.category)
                || f.start >= f.end
                || f.end > s.text.len()
                || !s.text.is_char_boundary(f.start)
                || !s.text.is_char_boundary(f.end)
                || !f.confidence.is_finite()
                || !(0.0..=1.0).contains(&f.confidence)
            {
                return Err("plugin_invalid_finding");
            }
        }
        Ok(())
    }
    pub fn validate_edits(&self, request: &Request) -> Result<(), &'static str> {
        if self.edits.len() > request.segments.len() {
            return Err("plugin_output_limit");
        }
        let mut seen = std::collections::HashSet::new();
        for edit in &self.edits {
            if !request.segments.iter().any(|s| s.id == edit.segment_id)
                || !seen.insert(&edit.segment_id)
            {
                return Err("plugin_invalid_edit");
            }
        }
        Ok(())
    }
}

pub fn read_frame<T: serde::de::DeserializeOwned>(stream: &mut impl Read) -> io::Result<T> {
    let mut size = [0; 4];
    stream.read_exact(&mut size)?;
    let size = u32::from_be_bytes(size) as usize;
    if size == 0 || size > FRAME_LIMIT {
        return Err(io::Error::other("invalid plugin frame size"));
    }
    let mut bytes = vec![0; size];
    stream.read_exact(&mut bytes)?;
    serde_json::from_slice(&bytes).map_err(|_| io::Error::other("invalid plugin frame"))
}
pub fn write_frame<T: serde::Serialize>(stream: &mut impl Write, value: &T) -> io::Result<()> {
    let bytes =
        serde_json::to_vec(value).map_err(|_| io::Error::other("invalid plugin response"))?;
    if bytes.len() > FRAME_LIMIT {
        return Err(io::Error::other("plugin frame limit"));
    }
    stream.write_all(&(bytes.len() as u32).to_be_bytes())?;
    stream.write_all(&bytes)?;
    stream.flush()
}
