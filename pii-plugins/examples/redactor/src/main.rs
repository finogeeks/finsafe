fn main() -> std::io::Result<()> {
    let redactor = finsafe_pii_redactor::Redactor::new(3, 4).map_err(std::io::Error::other)?;
    finsafe_pii_plugin_sdk::serve(|segments| Ok(redactor.process(segments)))
}
