public class OperationResult<T>
{
    public bool Succeeded { get; }
    public T? Data { get; }
    public string Message { get; }

    public OperationResult(bool succeeded, T? data, string message)
    {
        Succeeded = succeeded;
        Data = data;
        Message = message;
    }
}